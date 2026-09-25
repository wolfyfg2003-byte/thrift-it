import { deliveryCapturePlan, reverseHold, stripeClient } from "@/lib/rail-hold";
import { shippingFromQuiqupState, verifyQuiqupSignature } from "@/lib/quiqup";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function admin() {
  const url = process.env.APP_SUPABASE_URL;
  const secret = process.env.APP_SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Could not reach the rail.");
  return createClient(url, secret, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-quiqup-signature") ?? "";
  const timestamp = request.headers.get("x-quiqup-timestamp") ?? "";
  if (!verifyQuiqupSignature(raw, signature, timestamp)) {
    return NextResponse.json({ error: "Bad signature." }, { status: 401 });
  }

  let body: {
    id?: unknown;
    uuid?: unknown;
    state?: unknown;
    state_updated_at?: unknown;
    partner_order_id?: unknown;
    tracking_url?: unknown;
  };
  try {
    body = JSON.parse(raw) as typeof body;
  } catch {
    return NextResponse.json({ error: "Bad body." }, { status: 400 });
  }

  const orderId = String(body.id ?? body.uuid ?? "");
  const state = typeof body.state === "string" ? body.state : "";
  const stateUpdatedAt = typeof body.state_updated_at === "string" ? body.state_updated_at : null;
  const partnerOrderId = typeof body.partner_order_id === "string" ? body.partner_order_id : "";
  const trackingUrl = typeof body.tracking_url === "string" ? body.tracking_url : null;
  if (!orderId || !state) return NextResponse.json({ ok: true });

  const shippingStatus = shippingFromQuiqupState(state);
  const db = admin();
  const safeOrderId = orderId.replace(/[^A-Za-z0-9-]/g, "");
  const safePartner = partnerOrderId.replace(/[^A-Za-z0-9-]/g, "");
  let query = db.from("transactions").select(
    "id, status, shipping_status, stripe_payment_intent_id, hold_expires_at, captured_at, quiqup_state_updated_at",
  );
  query = safePartner
    ? query.or(`quiqup_order_id.eq.${safeOrderId},quiqup_partner_order_id.eq.${safePartner}`)
    : query.eq("quiqup_order_id", safeOrderId);
  const { data: rows } = await query.limit(1);
  const row = rows?.[0];
  if (!row) return NextResponse.json({ ok: true });

  if (
    stateUpdatedAt &&
    row.quiqup_state_updated_at &&
    new Date(stateUpdatedAt).getTime() <= new Date(row.quiqup_state_updated_at).getTime()
  ) {
    return NextResponse.json({ ok: true });
  }

  const patch: Record<string, string | boolean | null> = {
    quiqup_order_id: orderId,
    quiqup_state: state,
    quiqup_state_updated_at: stateUpdatedAt ?? new Date().toISOString(),
    ...(trackingUrl ? { quiqup_tracking_url: trackingUrl } : {}),
    ...(shippingStatus ? { shipping_status: shippingStatus } : {}),
  };

  if (state === "delivery_complete" && row.shipping_status !== "delivered") {
    const deliveredAt = new Date();
    const plan = deliveryCapturePlan(deliveredAt, row.hold_expires_at);
    patch.delivered_at = deliveredAt.toISOString();
    patch.auto_release_at = plan.autoReleaseAt;
    patch.capture_mode = plan.captureMode;
  }

  if (state === "returned_to_origin" || state === "cancelled") {
    if (row.status !== "completed" && row.status !== "canceled") {
      await reverseHold(stripeClient(), row.stripe_payment_intent_id);
      patch.status = "canceled";
    }
  }

  const updated = await db.from("transactions").update(patch).eq("id", row.id);
  if (updated.error) {
    return NextResponse.json({ error: updated.error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
