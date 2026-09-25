import { createHmac, timingSafeEqual } from "node:crypto";

export type QuiqupAddress = {
  address1: string;
  address2?: string;
  town: string;
  country: "UAE";
  coords?: [number, number];
};

export type QuiqupStop = {
  contact_name: string;
  contact_phone: string;
  notes?: string;
  address: QuiqupAddress;
};

export type QuiqupCreateInput = {
  partnerOrderId: string;
  origin: QuiqupStop;
  destination: QuiqupStop;
  itemName: string;
  ready?: boolean;
};

export type QuiqupOrder = {
  id: string;
  partner_order_id?: string;
  state?: string;
  state_updated_at?: string;
  tracking_url?: string;
};

type FallbackOrigin = {
  contact_name: string;
  contact_phone: string;
  address1: string;
  address2?: string;
  town?: string;
};

function baseUrl(): string {
  return (process.env.QUIQUP_BASE_URL ?? "https://api.staging.quiqup.com").replace(/\/$/, "");
}

function token(): string | null {
  const value = process.env.QUIQUP_API_TOKEN?.trim();
  return value || null;
}

export function quiqupConfigured(): boolean {
  return Boolean(token());
}

export function fallbackOrigin(): QuiqupStop | null {
  const raw = process.env.QUIQUP_FALLBACK_ORIGIN?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as FallbackOrigin;
    if (!parsed.contact_name || !parsed.contact_phone || !parsed.address1) return null;
    return {
      contact_name: parsed.contact_name,
      contact_phone: parsed.contact_phone,
      address: {
        address1: parsed.address1,
        address2: parsed.address2,
        town: parsed.town || "Dubai",
        country: "UAE",
      },
    };
  } catch {
    return null;
  }
}

export function stopFromAddress(input: {
  name: string;
  phone: string;
  building?: string;
  unit?: string;
  street?: string;
  community?: string;
  emirate?: string;
  notes?: string;
}): QuiqupStop | null {
  const name = input.name.trim();
  const phone = input.phone.replace(/\s/g, "");
  const community = (input.community ?? "").trim();
  const building = (input.building ?? "").trim();
  const street = (input.street ?? "").trim();
  const unit = (input.unit ?? "").trim();
  if (!name || !phone.startsWith("+971") || phone.length < 12) return null;
  const line = [building, street, community].filter(Boolean).join(", ");
  if (!line) return null;
  return {
    contact_name: name,
    contact_phone: phone,
    notes: input.notes?.trim() || undefined,
    address: {
      address1: line,
      address2: unit || undefined,
      town: (input.emirate ?? "Dubai").trim() || "Dubai",
      country: "UAE",
    },
  };
}

async function quiqupFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const secret = token();
  if (!secret) throw new Error("Courier is not configured.");
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const raw = await response.text();
  let json: T & { error?: string; message?: string };
  try {
    json = JSON.parse(raw) as T & { error?: string; message?: string };
  } catch {
    throw new Error(response.ok ? "Courier sent an empty reply." : `Courier failed (${response.status}).`);
  }
  if (!response.ok) {
    throw new Error(json.error ?? json.message ?? `Courier failed (${response.status}).`);
  }
  return json;
}

function asOrder(payload: unknown): QuiqupOrder {
  const row = payload as { id?: unknown; order?: QuiqupOrder } & QuiqupOrder;
  const order = row.order ?? row;
  if (!order.id) throw new Error("Courier did not return an order.");
  return {
    id: String(order.id),
    partner_order_id: order.partner_order_id,
    state: order.state,
    state_updated_at: order.state_updated_at,
    tracking_url: order.tracking_url,
  };
}

export async function findOrderByPartnerId(partnerOrderId: string): Promise<QuiqupOrder | null> {
  const query = new URLSearchParams({ "filters[partner_order_id]": partnerOrderId });
  const payload = await quiqupFetch<unknown>(`/orders?${query.toString()}`);
  const list = Array.isArray(payload)
    ? payload
    : ((payload as { data?: unknown[] }).data ?? (payload as { orders?: unknown[] }).orders ?? []);
  if (!Array.isArray(list) || list.length === 0) return null;
  return asOrder(list[0]);
}

export async function createDelivery(input: QuiqupCreateInput): Promise<QuiqupOrder> {
  const existing = await findOrderByPartnerId(input.partnerOrderId).catch(() => null);
  if (existing) return existing;
  const payload = await quiqupFetch<unknown>("/orders", {
    method: "POST",
    body: JSON.stringify({
      kind: "partner_return",
      partner_order_id: input.partnerOrderId,
      payment_mode: "pre_paid",
      payment_amount: 0,
      ready_for_collection: Boolean(input.ready),
      origin: input.origin,
      destination: input.destination,
      items: [{ name: input.itemName.slice(0, 80) || "Parcel 1", quantity: 1, parcel_barcode: "" }],
    }),
  });
  return asOrder(payload);
}

export async function markReadyForCollection(orderId: string): Promise<QuiqupOrder> {
  const payload = await quiqupFetch<unknown>(`/orders/${orderId}/ready_for_collection`, {
    method: "PUT",
  });
  return asOrder(payload);
}

export function verifyQuiqupSignature(rawBody: string, signature: string, timestamp: string): boolean {
  const secret = process.env.QUIQUP_WEBHOOK_SECRET?.trim();
  if (!secret || !signature || !timestamp) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const left = Buffer.from(expected);
  const right = Buffer.from(signature);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function shippingFromQuiqupState(state: string): string | null {
  switch (state) {
    case "collected":
      return "picked_up";
    case "out_for_delivery":
      return "out_for_delivery";
    case "delivery_complete":
      return "delivered";
    case "collection_failed":
      return "collection_failed";
    case "delivery_failed":
      return "delivery_failed";
    case "return_to_origin":
      return "returning";
    case "returned_to_origin":
      return "returned";
    case "cancelled":
      return "cancelled";
    case "error":
      return "rejected";
    case "ready_for_collection":
      return "label_printed";
    default:
      return null;
  }
}
