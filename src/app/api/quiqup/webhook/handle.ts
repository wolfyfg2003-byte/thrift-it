import { reverseHold, stripeClient } from "@/lib/rail-hold";
import { leadingQuiqupState, shippingFromQuiqupState, verifyQuiqupSignature } from "@/lib/quiqup";
import { applyCourierState, shipRank } from "@/lib/rail-quiqup";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function admin() {
  const url = process.env.APP_SUPABASE_URL;
  const secret = process.env.APP_SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Could not reach the rail.");
  return createClient(url, secret, { auth: { persistSession: false } });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

type WebhookOrder = {
  id?: unknown;
  uuid?: unknown;
  order_id?: unknown;
  state?: unknown;
  status?: unknown;
  state_updated_at?: unknown;
  partner_order_id?: unknown;
  partner_id?: unknown;
  tracking_url?: unknown;
};

function webhookOrder(raw: unknown): WebhookOrder {
  if (!raw || typeof raw !== "object") return {};
  const row = raw as Record<string, unknown>;
  const payload = row.payload && typeof row.payload === "object" ? (row.payload as Record<string, unknown>) : row;
  const order = payload.order && typeof payload.order === "object" ? (payload.order as Record<string, unknown>) : payload;
  const attrs = order.attributes && typeof order.attributes === "object" ? (order.attributes as Record<string, unknown>) : {};
  const lastEvent = order.last_event ?? attrs.last_event ?? payload.last_event ?? row.last_event;
  const lastState =
    lastEvent && typeof lastEvent === "object"
      ? (lastEvent as Record<string, unknown>).state ??
        (lastEvent as Record<string, unknown>).status ??
        (lastEvent as Record<string, unknown>).name
      : lastEvent;
  return {
    ...order,
    ...attrs,
    state: order.state ?? attrs.state ?? payload.state ?? row.state ?? lastState,
    status: order.status ?? attrs.status ?? payload.status ?? row.status ?? lastState,
  };
}

function token(raw: unknown): string {
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  if (typeof raw === "string") return raw.trim();
  return "";
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyQuiqupSignature(raw, request)) {
    return NextResponse.json({ error: "Bad signature." }, { status: 401 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad body." }, { status: 400 });
  }
  const body = webhookOrder(parsed);

  const orderId = token(body.id ?? body.uuid ?? body.order_id);
  const state = leadingQuiqupState(parsed) ?? token(body.state ?? body.status);
  const stateUpdatedAt = typeof body.state_updated_at === "string" ? body.state_updated_at : null;
  const partnerOrderId = token(body.partner_order_id ?? body.partner_id);
  const trackingUrl = typeof body.tracking_url === "string" ? body.tracking_url : null;
  if (!orderId && !partnerOrderId) return NextResponse.json({ ok: true });
  if (!state) return NextResponse.json({ ok: true });

  const db = admin();
  const safeOrderId = orderId.replace(/[^A-Za-z0-9-]/g, "");
  const safePartner = partnerOrderId.replace(/[^A-Za-z0-9-]/g, "");
  let query = db.from("transactions").select(
    "id, status, shipping_status, stripe_payment_intent_id, hold_expires_at, captured_at, quiqup_state_updated_at, quiqup_tracking_url",
  );
  const filters = [
    safeOrderId ? `quiqup_order_id.eq.${safeOrderId}` : "",
    safePartner ? `quiqup_partner_order_id.eq.${safePartner}` : "",
  ].filter(Boolean);
  query = filters.length > 1 ? query.or(filters.join(",")) : safePartner
    ? query.eq("quiqup_partner_order_id", safePartner)
    : query.eq("quiqup_order_id", safeOrderId);
  const { data: rows } = await query.limit(1);
  const row = rows?.[0];
  if (!row) return NextResponse.json({ ok: true });

  const mapped = shippingFromQuiqupState(state);
  const staleTime =
    Boolean(stateUpdatedAt) &&
    Boolean(row.quiqup_state_updated_at) &&
    new Date(stateUpdatedAt as string).getTime() <= new Date(row.quiqup_state_updated_at).getTime();
  if (staleTime && (!mapped || shipRank(mapped) <= shipRank(row.shipping_status))) {
    return NextResponse.json({ ok: true });
  }

  await applyCourierState(db, row, {
    id: orderId || undefined,
    state,
    tracking_url: trackingUrl,
    state_updated_at: stateUpdatedAt,
  });

  const canceled =
    state.trim().toLowerCase().replace(/[\s-]+/g, "_") === "returned_to_origin" ||
    state.trim().toLowerCase() === "cancelled" ||
    state.trim().toLowerCase() === "canceled";
  if (canceled && row.status !== "completed" && row.status !== "canceled") {
    await reverseHold(stripeClient(), row.stripe_payment_intent_id);
    await db.from("transactions").update({ status: "canceled" }).eq("id", row.id);
  }

  return NextResponse.json({ ok: true });
}
