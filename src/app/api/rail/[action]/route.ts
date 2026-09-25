import {
  createDelivery,
  fallbackOrigin,
  markReadyForCollection,
  quiqupConfigured,
  stopFromAddress,
  type QuiqupStop,
} from "@/lib/quiqup";
import { createClient } from "@supabase/supabase-js";
import {
  aedToFils,
  captureIfNeeded,
  deliveryCapturePlan,
  holdExpiresAt,
  quoteCheckout,
  reverseHold,
  stripeClient,
} from "@/lib/rail-hold";
import { NextResponse } from "next/server";

const NEXT_SHIP: Record<string, string> = {
  pending: "label_printed",
  label_printed: "picked_up",
  picked_up: "out_for_delivery",
  out_for_delivery: "delivered",
};

function staging() {
  const url = process.env.APP_SUPABASE_URL;
  const publishable = process.env.APP_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.APP_SUPABASE_SECRET_KEY;
  if (!url || !publishable || !secret) {
    throw new Error("Could not start the hold.");
  }
  return {
    user: createClient(url, publishable),
    admin: createClient(url, secret, { auth: { persistSession: false } }),
  };
}

async function callerId(
  request: Request,
): Promise<{ userId: string | null; reason: "ok" | "no-token" | "bad-token" }> {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return { userId: null, reason: "no-token" };
  const { user } = staging();
  const { data, error } = await user.auth.getUser(token);
  if (error || !data.user) return { userId: null, reason: "bad-token" };
  return { userId: data.user.id, reason: "ok" };
}

function stopFromUnknown(raw: unknown): QuiqupStop | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.contact_name === "string" && row.address && typeof row.address === "object") {
    return raw as QuiqupStop;
  }
  return stopFromAddress({
    name: typeof row.name === "string" ? row.name : "",
    phone: typeof row.phone === "string" ? row.phone : "",
    building: typeof row.building === "string" ? row.building : "",
    unit: typeof row.unit === "string" ? row.unit : "",
    street: typeof row.street === "string" ? row.street : "",
    community: typeof row.community === "string" ? row.community : "",
    emirate: typeof row.emirate === "string" ? row.emirate : "Dubai",
    notes: typeof row.notes === "string" ? row.notes : "",
  });
}

async function bookQuiqup(
  admin: ReturnType<typeof staging>["admin"],
  row: {
    id: string;
    title: string | null;
    destination_address: unknown;
    quiqup_order_id: string | null;
  },
) {
  if (!quiqupConfigured() || row.quiqup_order_id) return null;
  const destination =
    stopFromUnknown(row.destination_address) ??
    (row.destination_address && typeof row.destination_address === "object"
      ? (row.destination_address as QuiqupStop)
      : null);
  const origin = fallbackOrigin();
  if (!destination || !origin) return null;
  const partnerOrderId = `TI-${row.id.replace(/-/g, "").slice(0, 12)}`;
  const order = await createDelivery({
    partnerOrderId,
    origin,
    destination,
    itemName: row.title ?? "Parcel 1",
  });
  await admin
    .from("transactions")
    .update({
      origin_address: origin,
      quiqup_order_id: order.id,
      quiqup_partner_order_id: partnerOrderId,
      quiqup_tracking_url: order.tracking_url ?? null,
      quiqup_state: order.state ?? "pending",
    })
    .eq("id", row.id);
  return order;
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Authorization, apikey, Content-Type",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Authorization, apikey, Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ action: string }> },
) {
  const { action } = await context.params;
  const caller = await callerId(request);
  const userId = caller.userId;
  if (!userId) {
    return json(
      {
        error:
          caller.reason === "bad-token"
            ? "This build and the website are on different rails."
            : "Sign in first.",
      },
      401,
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    switch (action) {
      case "create-payment-intent":
        return createIntent(userId, body);
      case "confirm-authorization":
        return confirmAuth(userId, body);
      case "advance-fulfillment":
        return advance(userId, body);
      case "open-dispute":
        return dispute(userId, body);
      case "sync-escrow":
        return sync(userId, body);
      case "release-hold":
        return releaseHold(userId, body);
      case "delete-account":
        return deleteAccount(userId);
      case "report-content":
        return reportContent(userId, body);
      case "ready-collection":
        return readyCollection(userId, body);
      default:
        return json({ error: "Unknown action." }, 404);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "That did not go through.";
    return json({ error: message }, 500);
  }
}

async function createIntent(userId: string, body: Record<string, unknown>) {
  const { admin } = staging();
  const stripe = stripeClient();
  const kind = body.kind === "plus" ? "plus" : "purchase";

  if (kind === "plus") {
    return json({ error: "Plus is not sold in this version." }, 400);
  }

  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  const itemPrice = Number(body.itemPrice);
  if (!listingId || !Number.isFinite(itemPrice) || itemPrice < 1) {
    return json({ error: "That piece cannot be held." }, 400);
  }
  const quote = quoteCheckout(itemPrice);
  const destination = stopFromUnknown(body.destination);

  const inserted = await admin
    .from("transactions")
    .insert({
      listing_id: listingId,
      buyer_id: userId,
      item_price: quote.item,
      protection: quote.protection,
      shipping_fee: quote.shipping,
      total: quote.total,
      status: "pending",
      kind: "purchase",
      shipping_status: "pending",
      brand: typeof body.brand === "string" ? body.brand : null,
      title: typeof body.title === "string" ? body.title : null,
      destination_address: destination,
    })
    .select("id")
    .single();
  if (inserted.error || !inserted.data) {
    return json({ error: inserted.error?.message ?? "Could not start the hold." }, 500);
  }
  const transactionId = inserted.data.id;

    const intent = await stripe.paymentIntents.create({
      amount: aedToFils(quote.total),
      currency: "aed",
      capture_method: "manual",
      automatic_payment_methods: { enabled: true },
      description:
        typeof body.title === "string" && body.title.trim()
          ? String(body.title).slice(0, 80)
          : "Thrift It hold",
      metadata: {
        kind: "purchase",
        transaction_id: transactionId,
        listing_id: listingId,
        buyer_id: userId,
        item_price: String(quote.item),
        total: String(quote.total),
      },
    });
  await admin
    .from("transactions")
    .update({
      stripe_payment_intent_id: intent.id,
      hold_expires_at: holdExpiresAt(),
      item_price: quote.item,
      protection: quote.protection,
      shipping_fee: quote.shipping,
      total: quote.total,
    })
    .eq("id", transactionId);

  return json({
    clientSecret: intent.client_secret,
    transactionId,
    paymentIntentId: intent.id,
  });
}

async function confirmAuth(userId: string, body: Record<string, unknown>) {
  const { admin } = staging();
  const transactionId = typeof body.transactionId === "string" ? body.transactionId : "";
  if (!transactionId) return json({ error: "Missing transaction." }, 400);

  const { data: row } = await admin
    .from("transactions")
    .select("id, buyer_id, kind, status, stripe_payment_intent_id, title, destination_address, quiqup_order_id")
    .eq("id", transactionId)
    .maybeSingle();
  if (!row || row.buyer_id !== userId) return json({ error: "Hold not found." }, 404);
  if (!row.stripe_payment_intent_id) return json({ error: "Hold is not ready." }, 409);

  const intent = await stripeClient().paymentIntents.retrieve(row.stripe_payment_intent_id);
  if (intent.status !== "requires_capture" && intent.status !== "succeeded") {
    return json({ error: "The card was not authorized." }, 402);
  }

  if (row.kind === "plus") {
    await admin
      .from("transactions")
      .update({
        status: "completed",
        authorized_at: new Date().toISOString(),
        captured_at: new Date().toISOString(),
        shipping_status: "not_required",
      })
      .eq("id", row.id);
    await admin.from("plus_entitlements").upsert({
      user_id: userId,
      active: true,
      stripe_payment_intent_id: row.stripe_payment_intent_id,
      activated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    await admin.from("profiles").update({ plus_active: true }).eq("id", userId);
    return json({ ok: true, status: "completed" });
  }

  if (row.status === "pending") {
    await admin
      .from("transactions")
      .update({
        status: "escrow_held",
        authorized_at: new Date().toISOString(),
        shipping_status: "pending",
      })
      .eq("id", row.id);
  }
  const booked = await bookQuiqup(admin, row).catch(() => null);
  return json({
    ok: true,
    status: "escrow_held",
    trackingUrl: booked?.tracking_url ?? null,
  });
}

async function readyCollection(userId: string, body: Record<string, unknown>) {
  const { admin } = staging();
  const transactionId = typeof body.transactionId === "string" ? body.transactionId : "";
  const { data: row } = await admin
    .from("transactions")
    .select("id, buyer_id, seller_id, status, shipping_status, quiqup_order_id")
    .eq("id", transactionId)
    .maybeSingle();
  if (!row || (row.buyer_id !== userId && row.seller_id !== userId)) {
    return json({ error: "Hold not found." }, 404);
  }
  if (row.status !== "escrow_held") return json({ error: "This hold cannot move yet." }, 409);
  if (!row.quiqup_order_id) return json({ error: "Courier is not booked yet." }, 409);
  const order = await markReadyForCollection(row.quiqup_order_id);
  await admin
    .from("transactions")
    .update({
      shipping_status: "label_printed",
      quiqup_state: order.state ?? "ready_for_collection",
      quiqup_tracking_url: order.tracking_url ?? null,
    })
    .eq("id", row.id);
  return json({ ok: true, shippingStatus: "label_printed", trackingUrl: order.tracking_url ?? null });
}

async function advance(userId: string, body: Record<string, unknown>) {
  const { admin } = staging();
  const transactionId = typeof body.transactionId === "string" ? body.transactionId : "";
  const { data: row } = await admin
    .from("transactions")
    .select("id, buyer_id, kind, status, shipping_status, stripe_payment_intent_id, hold_expires_at, captured_at")
    .eq("id", transactionId)
    .maybeSingle();
  if (!row || row.buyer_id !== userId) return json({ error: "Hold not found." }, 404);
  if (row.kind !== "purchase" || (row.status !== "escrow_held" && row.status !== "pending")) {
    return json({ error: "This hold cannot move yet." }, 409);
  }
  if (row.status === "pending") {
    const intent = row.stripe_payment_intent_id
      ? await stripeClient().paymentIntents.retrieve(row.stripe_payment_intent_id)
      : null;
    if (intent && (intent.status === "requires_capture" || intent.status === "succeeded")) {
      await admin
        .from("transactions")
        .update({ status: "escrow_held", authorized_at: new Date().toISOString() })
        .eq("id", row.id);
    } else {
      return json({ error: "This hold cannot move yet." }, 409);
    }
  }
  const next = NEXT_SHIP[row.shipping_status];
  if (!next) return json({ error: "Already landed." }, 409);
  if (next !== "delivered") {
    const moved = await admin.from("transactions").update({ shipping_status: next }).eq("id", row.id);
    if (moved.error) return json({ error: moved.error.message }, 500);
    return json({ ok: true, shippingStatus: next });
  }
  const deliveredAt = new Date();
  const plan = deliveryCapturePlan(deliveredAt, row.hold_expires_at);
  const patch: Record<string, string | null> = {
    shipping_status: "delivered",
    delivered_at: deliveredAt.toISOString(),
    auto_release_at: plan.autoReleaseAt,
    capture_mode: plan.captureMode,
  };
  if (plan.captureMode === "on_delivered" && !row.captured_at) {
    const captured = await captureIfNeeded(stripeClient(), row.stripe_payment_intent_id);
    if (captured) patch.captured_at = new Date().toISOString();
  }
  const full = await admin.from("transactions").update(patch).eq("id", row.id);
  if (full.error) {
    const fallback = await admin
      .from("transactions")
      .update({ shipping_status: "delivered" })
      .eq("id", row.id);
    if (fallback.error) return json({ error: fallback.error.message }, 500);
  }
  return json({ ok: true, shippingStatus: "delivered", captureMode: plan.captureMode });
}

async function dispute(userId: string, body: Record<string, unknown>) {
  const { admin } = staging();
  const transactionId = typeof body.transactionId === "string" ? body.transactionId : "";
  const { data: row } = await admin
    .from("transactions")
    .select("id, buyer_id, status, shipping_status, stripe_payment_intent_id")
    .eq("id", transactionId)
    .maybeSingle();
  if (!row || row.buyer_id !== userId) return json({ error: "Hold not found." }, 404);
  if (row.status === "completed" || row.status === "canceled") {
    return json({ error: "This hold is already closed." }, 409);
  }
  if (row.shipping_status !== "delivered") {
    return json({ error: "Open a dispute after it lands." }, 409);
  }
  await reverseHold(stripeClient(), row.stripe_payment_intent_id);
  const frozen = await admin
    .from("transactions")
    .update({
      status: "frozen",
      disputed: true,
      dispute_reason: typeof body.reason === "string" ? body.reason.slice(0, 280) : "opened_in_app",
      dispute_opened_at: new Date().toISOString(),
    })
    .eq("id", row.id);
  if (frozen.error) {
    const fallback = await admin.from("transactions").update({ status: "frozen" }).eq("id", row.id);
    if (fallback.error) return json({ error: fallback.error.message }, 500);
  }
  return json({ ok: true, status: "frozen" });
}

async function sync(userId: string, body: Record<string, unknown>) {
  const { admin } = staging();
  const transactionId = typeof body.transactionId === "string" ? body.transactionId : "";
  const { data: row } = await admin
    .from("transactions")
    .select("id, buyer_id, status, shipping_status, stripe_payment_intent_id, captured_at")
    .eq("id", transactionId)
    .maybeSingle();
  if (!row || row.buyer_id !== userId) return json({ error: "Hold not found." }, 404);
  if (row.status === "pending" && row.stripe_payment_intent_id) {
    const intent = await stripeClient().paymentIntents.retrieve(row.stripe_payment_intent_id);
    if (intent.status === "requires_capture" || intent.status === "succeeded") {
      await admin
        .from("transactions")
        .update({ status: "escrow_held", authorized_at: new Date().toISOString() })
        .eq("id", row.id);
      return json({ ok: true, status: "escrow_held", shippingStatus: row.shipping_status });
    }
  }
  if (row.status !== "escrow_held" || row.shipping_status !== "delivered") {
    return json({ ok: true, status: row.status, shippingStatus: row.shipping_status });
  }
  const captured = row.captured_at
    ? true
    : await captureIfNeeded(stripeClient(), row.stripe_payment_intent_id);
  if (!captured) return json({ error: "Could not release the hold." }, 409);
  await admin
    .from("transactions")
    .update({
      status: "completed",
      captured_at: row.captured_at ?? new Date().toISOString(),
    })
    .eq("id", row.id);
  return json({ ok: true, status: "completed" });
}

async function releaseHold(userId: string, body: Record<string, unknown>) {
  const { admin } = staging();
  const transactionId = typeof body.transactionId === "string" ? body.transactionId : "";
  const { data: row } = await admin
    .from("transactions")
    .select("id, buyer_id, status, shipping_status, stripe_payment_intent_id, captured_at")
    .eq("id", transactionId)
    .maybeSingle();
  if (!row || row.buyer_id !== userId) return json({ error: "Hold not found." }, 404);
  if (row.status !== "escrow_held" || row.shipping_status !== "delivered") {
    return json({ error: "This hold cannot release yet." }, 409);
  }
  const captured = row.captured_at
    ? true
    : await captureIfNeeded(stripeClient(), row.stripe_payment_intent_id);
  if (!captured) return json({ error: "Could not release the hold." }, 409);
  await admin
    .from("transactions")
    .update({
      status: "completed",
      captured_at: row.captured_at ?? new Date().toISOString(),
    })
    .eq("id", row.id);
  return json({ ok: true, status: "completed" });
}

async function deleteAccount(userId: string) {
  const { admin } = staging();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}

async function reportContent(userId: string, body: Record<string, unknown>) {
  const { admin } = staging();
  const kind = typeof body.kind === "string" ? body.kind : "";
  const targetId = typeof body.targetId === "string" ? body.targetId.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!["listing", "seller", "thread"].includes(kind) || !targetId || !reason) {
    return json({ error: "That report is incomplete." }, 400);
  }
  const inserted = await admin.from("content_reports").insert({
    reporter_id: userId,
    kind,
    target_id: targetId,
    reason: reason.slice(0, 240),
  });
  if (inserted.error) return json({ error: inserted.error.message }, 500);
  return json({ ok: true });
}
