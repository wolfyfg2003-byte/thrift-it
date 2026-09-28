import {
  createDelivery,
  fetchQuiqupOrder,
  findOrderByPartnerId,
  findOrderOnList,
  isQuiqupStop,
  listQuiqupOrders,
  mergeCourierOrders,
  normalizeStop,
  quiqupConfigured,
  shippingFromQuiqupState,
  stopFromUnknown,
  type QuiqupOrder,
} from "@/lib/quiqup";
import { deliveryCapturePlan } from "@/lib/rail-hold";
import { pickupOrigin, type ListingRow } from "@/lib/rail-market";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CourierTransaction = {
  id: string;
  title: string | null;
  listing_id?: string | null;
  destination_address: unknown;
  quiqup_order_id: string | null;
  is_consignment?: boolean | null;
  seller_id?: string | null;
};

export async function bookQuiqup(
  admin: SupabaseClient,
  row: CourierTransaction,
  opts?: { ready?: boolean },
): Promise<QuiqupOrder | null> {
  if (row.quiqup_order_id) return null;
  if (!quiqupConfigured()) {
    throw new Error("Courier is not configured.");
  }
  const destination = stopFromUnknown(row.destination_address);
  if (!destination) {
    throw new Error("Add a full delivery name, UAE mobile, and address.");
  }
  let listing: ListingRow | null = null;
  if (row.listing_id) {
    const { data } = await admin
      .from("listings")
      .select("seller_id, seller_username, is_consignment, location")
      .eq("id", row.listing_id)
      .maybeSingle();
    listing = data
      ? ({
          seller_id: data.seller_id,
          seller_username: data.seller_username,
          is_consignment: Boolean(data.is_consignment),
          location: data.location,
        } as ListingRow)
      : null;
  }
  const origin = await pickupOrigin(
    admin,
    listing ?? {
      seller_id: row.seller_id ?? null,
      is_consignment: Boolean(row.is_consignment),
    },
  );
  if (!origin) {
    throw new Error("Pickup address is missing. Seller needs a saved address, or set the warehouse origin.");
  }
  const partnerOrderId = `TI-${row.id.replace(/-/g, "").slice(0, 12)}`;
  const order = await createDelivery({
    partnerOrderId,
    origin,
    destination: isQuiqupStop(destination) ? normalizeStop(destination) : destination,
    itemName: row.title ?? "Parcel 1",
    ready: Boolean(opts?.ready),
  });
  await admin
    .from("transactions")
    .update({
      origin_address: origin,
      quiqup_order_id: order.id,
      quiqup_partner_order_id: partnerOrderId,
      quiqup_tracking_url: order.tracking_url ?? null,
      quiqup_state: order.state ?? (opts?.ready ? "ready_for_collection" : "pending"),
    })
    .eq("id", row.id);
  return order;
}

export type CourierHoldRow = {
  id: string;
  shipping_status: string;
  hold_expires_at?: string | null;
  quiqup_tracking_url?: string | null;
};

export function shipRank(status: string): number {
  switch (status) {
    case "delivered":
    case "not_required":
      return 5;
    case "out_for_delivery":
      return 4;
    case "picked_up":
      return 3;
    case "label_printed":
      return 2;
    case "pending":
      return 1;
    default:
      return 0;
  }
}

async function updateHold(
  admin: SupabaseClient,
  id: string,
  patch: Record<string, string | null>,
): Promise<void> {
  const current = { ...patch };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { error } = await admin.from("transactions").update(current).eq("id", id);
    if (!error) return;
    const missing = error.message.match(/'([^']+)' column/);
    if (!missing || !(missing[1] in current)) throw new Error(error.message);
    delete current[missing[1]];
    if (Object.keys(current).length === 0) throw new Error(error.message);
  }
}

export async function applyCourierState(
  admin: SupabaseClient,
  row: CourierHoldRow,
  order: { id?: string; state?: string | null; tracking_url?: string | null; state_updated_at?: string | null },
): Promise<{ shippingStatus: string; trackingUrl: string | null }> {
  const mapped = order.state ? shippingFromQuiqupState(order.state) : null;
  const trackingUrl = order.tracking_url ?? row.quiqup_tracking_url ?? null;
  const nextShip = mapped && shipRank(mapped) >= shipRank(row.shipping_status) ? mapped : row.shipping_status;
  const patch: Record<string, string | null> = {
    ...(order.id ? { quiqup_order_id: String(order.id) } : {}),
    ...(order.state ? { quiqup_state: order.state } : {}),
    quiqup_state_updated_at: order.state_updated_at ?? new Date().toISOString(),
    ...(trackingUrl ? { quiqup_tracking_url: trackingUrl } : {}),
    shipping_status: nextShip,
  };
  if (nextShip === "delivered" && row.shipping_status !== "delivered") {
    const deliveredAt = new Date();
    const plan = deliveryCapturePlan(deliveredAt, row.hold_expires_at ?? null);
    patch.delivered_at = deliveredAt.toISOString();
    patch.auto_release_at = plan.autoReleaseAt;
    patch.capture_mode = plan.captureMode;
  }
  await updateHold(admin, row.id, patch);
  return { shippingStatus: nextShip, trackingUrl };
}

export async function refreshCourier(
  admin: SupabaseClient,
  row: CourierHoldRow & { quiqup_order_id?: string | null; quiqup_partner_order_id?: string | null },
): Promise<{ shippingStatus: string; trackingUrl: string | null } | null> {
  if (!quiqupConfigured()) return null;
  const fetched: QuiqupOrder[] = [];
  if (row.quiqup_order_id) {
    const order = await fetchQuiqupOrder(row.quiqup_order_id).catch(() => null);
    if (order) fetched.push(order);
  }
  if (row.quiqup_partner_order_id) {
    const order = await findOrderByPartnerId(row.quiqup_partner_order_id).catch(() => null);
    if (order) fetched.push(order);
  }
  const listed = await findOrderOnList([row.quiqup_order_id, row.quiqup_partner_order_id]).catch(() => null);
  if (listed) fetched.push(listed);
  const order = mergeCourierOrders(fetched);
  if (!order) return null;
  return applyCourierState(admin, row, order);
}

export async function pollOpenCourierHolds(
  admin: SupabaseClient,
): Promise<{ scanned: number; advanced: number }> {
  if (!quiqupConfigured()) return { scanned: 0, advanced: 0 };
  const { data, error } = await admin
    .from("transactions")
    .select(
      "id, shipping_status, hold_expires_at, quiqup_tracking_url, quiqup_order_id, quiqup_partner_order_id",
    )
    .eq("kind", "purchase")
    .eq("status", "escrow_held")
    .neq("shipping_status", "delivered")
    .neq("shipping_status", "not_required")
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) throw new Error(error.message);
  const open = (data ?? []).filter((row) => row.quiqup_order_id || row.quiqup_partner_order_id);
  if (open.length === 0) return { scanned: 0, advanced: 0 };

  const listed = await listQuiqupOrders().catch(() => []);
  let advanced = 0;
  for (const row of open) {
    const matches = listed.filter((order) => {
      const byId = Boolean(row.quiqup_order_id) && order.id === row.quiqup_order_id;
      const byPartner =
        Boolean(row.quiqup_partner_order_id) && order.partner_order_id === row.quiqup_partner_order_id;
      return byId || byPartner;
    });
    const mapped = matches
      .map((order) => (order.state ? shippingFromQuiqupState(order.state) : null))
      .filter((status): status is string => Boolean(status));
    const listLeads = mapped.some((status) => shipRank(status) >= 5);
    const fetched = [...matches];
    if (!listLeads) {
      const refreshed = await refreshCourier(admin, row).catch(() => null);
      if (refreshed && shipRank(refreshed.shippingStatus) > shipRank(row.shipping_status)) {
        advanced += 1;
      }
      continue;
    }
    const order = mergeCourierOrders(fetched);
    if (!order) continue;
    const result = await applyCourierState(admin, row, order);
    if (shipRank(result.shippingStatus) > shipRank(row.shipping_status)) advanced += 1;
  }
  return { scanned: open.length, advanced };
}
