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

const ORDER_KINDS = ["partner_next_day", "partner_same_day", "partner_return"] as const;
type OrderKind = (typeof ORDER_KINDS)[number];

function baseUrl(): string {
  const fallback = "https://api.staging.quiqup.com";
  const value = (process.env.QUIQUP_BASE_URL ?? fallback).replace(/\/$/, "");
  if (/thrifit\.ae|vercel\.app|\/api\/quiqup/i.test(value)) return fallback;
  return value || fallback;
}

function token(): string | null {
  const value = process.env.QUIQUP_API_TOKEN?.trim();
  return value || null;
}

export function quiqupConfigured(): boolean {
  return Boolean(token());
}

export function e164Uae(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const local = digits.startsWith("971") ? digits.slice(3) : digits.startsWith("0") ? digits.slice(1) : digits;
  return local.length >= 8 && local.length <= 10 ? `+971${local}` : "";
}

export function isQuiqupStop(raw: unknown): raw is QuiqupStop {
  if (!raw || typeof raw !== "object") return false;
  const row = raw as Record<string, unknown>;
  const name = typeof row.contact_name === "string" ? row.contact_name.trim() : "";
  const phone = e164Uae(typeof row.contact_phone === "string" ? row.contact_phone : "");
  const address = row.address && typeof row.address === "object" ? (row.address as Record<string, unknown>) : null;
  const line = typeof address?.address1 === "string" ? address.address1.trim() : "";
  return Boolean(name && phone && line);
}

export function normalizeStop(raw: QuiqupStop): QuiqupStop {
  const phone = e164Uae(raw.contact_phone) || raw.contact_phone;
  const address1 = raw.address.address1.trim();
  const town = (raw.address.town || "Dubai").trim() || "Dubai";
  return {
    contact_name: raw.contact_name.trim(),
    contact_phone: phone,
    notes: raw.notes?.trim() || undefined,
    address: {
      address1,
      address2: raw.address.address2?.trim() || undefined,
      town,
      country: "UAE",
      ...(raw.address.coords ? { coords: raw.address.coords } : {}),
    },
  };
}

export function fallbackOrigin(): QuiqupStop | null {
  const raw = process.env.QUIQUP_FALLBACK_ORIGIN?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as FallbackOrigin;
    const phone = e164Uae(parsed.contact_phone);
    if (!parsed.contact_name || !phone || !parsed.address1) return null;
    return {
      contact_name: parsed.contact_name,
      contact_phone: phone,
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

export function stopFromUnknown(raw: unknown): QuiqupStop | null {
  if (!raw || typeof raw !== "object") return null;
  if (isQuiqupStop(raw)) return normalizeStop(raw);
  const row = raw as Record<string, unknown>;
  return stopFromAddress({
    name: typeof row.name === "string" ? row.name : typeof row.contact_name === "string" ? row.contact_name : "",
    phone: typeof row.phone === "string" ? row.phone : typeof row.contact_phone === "string" ? row.contact_phone : "",
    building: typeof row.building === "string" ? row.building : "",
    unit: typeof row.unit === "string" ? row.unit : "",
    street: typeof row.street === "string" ? row.street : "",
    community: typeof row.community === "string" ? row.community : "",
    emirate: typeof row.emirate === "string" ? row.emirate : "Dubai",
    notes: typeof row.notes === "string" ? row.notes : typeof row.instructions === "string" ? row.instructions : "",
  });
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
  const phone = e164Uae(input.phone);
  const community = (input.community ?? "").trim();
  const building = (input.building ?? "").trim();
  const street = (input.street ?? "").trim();
  const unit = (input.unit ?? "").trim();
  const line = [building, street, community].filter(Boolean).join(", ");
  if (!name || !phone || !line) return null;
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

function errorFromBody(json: unknown, status: number): string {
  if (!json || typeof json !== "object") return `Courier failed (${status}).`;
  const row = json as Record<string, unknown>;
  const errors = row.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const parts = errors
      .map((item) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return "";
        const err = item as Record<string, unknown>;
        return [err.detail, err.title, err.message, err.error]
          .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
          .join(" ");
      })
      .filter(Boolean);
    if (parts.length > 0) return parts.join(" ");
  }
  if (typeof row.error === "string" && row.error.trim()) return row.error;
  if (typeof row.message === "string" && row.message.trim()) return row.message;
  return `Courier failed (${status}).`;
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
  let json: unknown = {};
  if (raw.trim()) {
    try {
      json = JSON.parse(raw) as unknown;
    } catch {
      if (!response.ok) {
        throw new Error(`Courier failed (${response.status}).`);
      }
      json = {};
    }
  }
  if (!response.ok) {
    const error = new Error(errorFromBody(json, response.status)) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return json as T;
}

function recordFrom(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {};
  const row = payload as Record<string, unknown>;
  if (row.order && typeof row.order === "object") return row.order as Record<string, unknown>;
  if (row.data && typeof row.data === "object") return row.data as Record<string, unknown>;
  return row;
}

function asText(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (!value || typeof value !== "object") return undefined;
  const row = value as Record<string, unknown>;
  return asText(row.state ?? row.status ?? row.name ?? row.event ?? row.kind ?? row.current);
}

function lastEventState(row: Record<string, unknown>): string | undefined {
  const events = row.events ?? row.statuses ?? row.history;
  if (Array.isArray(events) && events.length > 0) {
    return asText(events[events.length - 1]);
  }
  return asText(row.last_event ?? row.latest_event ?? row.last_status ?? row.current_event);
}

function courierProgress(state: string): number {
  const mapped = shippingFromQuiqupState(state);
  if (!mapped) return -1;
  if (mapped === "delivered") return 50;
  if (mapped === "out_for_delivery") return 40;
  if (mapped === "picked_up") return 30;
  if (mapped === "label_printed") return 20;
  return 0;
}

function collectStates(value: unknown, into: string[], depth = 0, keyHint = ""): void {
  if (depth > 5 || into.length > 40) return;
  if (typeof value === "string") {
    if (keyHint && /state|status|event|delivery|collection|progress|kind/i.test(keyHint)) {
      into.push(value);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStates(item, into, depth + 1, keyHint);
    return;
  }
  if (!value || typeof value !== "object") return;
  const row = value as Record<string, unknown>;
  for (const [key, item] of Object.entries(row)) {
    if (/address|origin|destination|contact|phone|items|coords|notes/i.test(key)) continue;
    collectStates(item, into, depth + 1, key);
  }
}

export function leadingQuiqupState(...candidates: unknown[]): string | undefined {
  const states: string[] = [];
  for (const candidate of candidates) collectStates(candidate, states);
  let best: string | undefined;
  let bestRank = -1;
  for (const state of states) {
    const rank = courierProgress(state);
    if (rank > bestRank) {
      bestRank = rank;
      best = state;
    }
  }
  return best;
}

export function mergeCourierOrders(orders: Array<QuiqupOrder | null | undefined>): QuiqupOrder | null {
  const list = orders.filter((row): row is QuiqupOrder => Boolean(row?.id));
  if (list.length === 0) return null;
  return list.reduce((best, row) => {
    const nextRank = courierProgress(row.state ?? "");
    const bestRank = courierProgress(best.state ?? "");
    if (nextRank > bestRank) {
      return {
        ...best,
        ...row,
        tracking_url: row.tracking_url ?? best.tracking_url,
        partner_order_id: row.partner_order_id ?? best.partner_order_id,
      };
    }
    return {
      ...best,
      tracking_url: best.tracking_url ?? row.tracking_url,
      partner_order_id: best.partner_order_id ?? row.partner_order_id,
    };
  });
}

function ordersFromPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const row = payload as Record<string, unknown>;
  if (Array.isArray(row.data)) return row.data;
  if (Array.isArray(row.orders)) return row.orders;
  if (Array.isArray(row.results)) return row.results;
  return [payload];
}

function asOrder(payload: unknown): QuiqupOrder {
  const nested = recordFrom(payload);
  const row = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const attrs =
    nested.attributes && typeof nested.attributes === "object"
      ? (nested.attributes as Record<string, unknown>)
      : {};
  const id =
    nested.id ??
    nested.uuid ??
    nested.order_id ??
    nested.order_ref ??
    nested.ref ??
    attrs.id ??
    attrs.order_ref ??
    row.uuid ??
    row.id ??
    row.order_ref;
  if (!id) throw new Error("Courier did not return an order.");
  const stateRaw =
    leadingQuiqupState(nested, attrs, row) ??
    asText(nested.state) ??
    asText(nested.status) ??
    asText(attrs.state) ??
    lastEventState(nested) ??
    asText(row.state) ??
    asText(row.status);
  const tracking =
    asText(nested.tracking_url) ??
    asText(attrs.tracking_url) ??
    asText(row.tracking_url);
  return {
    id: String(id).replace(/^#/, ""),
    partner_order_id:
      asText(nested.partner_order_id) ??
      asText(nested.partner_id) ??
      asText(attrs.partner_order_id) ??
      asText(attrs.partner_id),
    state: stateRaw,
    state_updated_at:
      asText(nested.state_updated_at) ?? asText(attrs.state_updated_at),
    tracking_url: tracking,
  };
}

function orderMatches(order: QuiqupOrder, needle: string): boolean {
  const wanted = needle.trim().toLowerCase().replace(/^#/, "");
  if (!wanted) return false;
  return (
    order.id.toLowerCase().replace(/^#/, "") === wanted ||
    (order.partner_order_id ?? "").toLowerCase() === wanted
  );
}

export async function fetchQuiqupOrder(orderId: string): Promise<QuiqupOrder> {
  return asOrder(await quiqupFetch<unknown>(`/orders/${orderId}`));
}

export async function listQuiqupOrders(): Promise<QuiqupOrder[]> {
  const payload = await quiqupFetch<unknown>("/orders").catch(() => null);
  if (!payload) return [];
  const matched: QuiqupOrder[] = [];
  for (const item of ordersFromPayload(payload)) {
    try {
      matched.push(asOrder(item));
    } catch {
      continue;
    }
  }
  return matched;
}

export async function findOrderOnList(needles: Array<string | null | undefined>): Promise<QuiqupOrder | null> {
  const wanted = needles.map((value) => value?.trim() ?? "").filter(Boolean);
  if (wanted.length === 0) return null;
  const listed = await listQuiqupOrders();
  return mergeCourierOrders(listed.filter((order) => wanted.some((needle) => orderMatches(order, needle))));
}

export async function findOrderByPartnerId(partnerOrderId: string): Promise<QuiqupOrder | null> {
  const queries = [
    new URLSearchParams({ "filters[partner_order_id]": partnerOrderId }),
    new URLSearchParams({ partner_order_id: partnerOrderId }),
    new URLSearchParams({ "filter[partner_order_id]": partnerOrderId }),
    new URLSearchParams({ "filters[partner_id]": partnerOrderId }),
    new URLSearchParams({ partner_id: partnerOrderId }),
    new URLSearchParams({ q: partnerOrderId }),
  ];
  const fetched: QuiqupOrder[] = [];
  for (const query of queries) {
    const payload = await quiqupFetch<unknown>(`/orders?${query.toString()}`).catch(() => null);
    if (!payload) continue;
    for (const item of ordersFromPayload(payload)) {
      try {
        const order = asOrder(item);
        if (orderMatches(order, partnerOrderId) || fetched.length === 0) fetched.push(order);
      } catch {
        continue;
      }
    }
    if (fetched.length > 0) break;
  }
  return mergeCourierOrders(fetched);
}

function isDuplicateOrder(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const status = (error as Error & { status?: number }).status;
  if (status === 409) return true;
  return /already exists|duplicate|taken|partner_order_id/i.test(error.message);
}

function isUnsupportedKind(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /kind|service_kind|not supported|invalid/i.test(error.message);
}

async function postOrder(kind: OrderKind, input: QuiqupCreateInput): Promise<QuiqupOrder> {
  const payload = await quiqupFetch<unknown>("/orders", {
    method: "POST",
    body: JSON.stringify({
      kind,
      service_kind: kind,
      partner_order_id: input.partnerOrderId,
      payment_mode: "pre_paid",
      payment_amount: 0,
      ready_for_collection: Boolean(input.ready),
      origin: input.origin,
      destination: input.destination,
      items: [{ name: input.itemName.slice(0, 80) || "Parcel 1", quantity: 1 }],
    }),
  });
  return asOrder(payload);
}

export async function createDelivery(input: QuiqupCreateInput): Promise<QuiqupOrder> {
  let lastError: unknown;
  for (const kind of ORDER_KINDS) {
    try {
      return await postOrder(kind, input);
    } catch (error) {
      if (isDuplicateOrder(error)) {
        const existing = await findOrderByPartnerId(input.partnerOrderId).catch(() => null);
        if (existing) return existing;
      }
      lastError = error;
      if (!isUnsupportedKind(error) && !isDuplicateOrder(error)) throw error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Could not book the courier.");
}

export async function markReadyForCollection(orderId: string): Promise<QuiqupOrder> {
  const fallback: QuiqupOrder = { id: orderId, state: "ready_for_collection" };
  const attempts: Array<{ path: string; method: "PUT" | "POST" }> = [
    { path: `/orders/${orderId}/ready_for_collection`, method: "PUT" },
    { path: `/orders/${orderId}/ready_for_collection`, method: "POST" },
  ];
  for (const attempt of attempts) {
    try {
      const payload = await quiqupFetch<unknown>(attempt.path, {
        method: attempt.method,
        body: "{}",
      });
      try {
        return asOrder(payload);
      } catch {
        return await fetchQuiqupOrder(orderId).catch(() => fallback);
      }
    } catch (error) {
      if (error instanceof Error && /already|ready_for_collection/i.test(error.message)) {
        return await fetchQuiqupOrder(orderId).catch(() => fallback);
      }
    }
  }
  return await fetchQuiqupOrder(orderId).catch(() => fallback);
}

function hmacHex(algorithm: "sha1" | "sha256", secret: string, message: string): string {
  return createHmac(algorithm, secret).update(message).digest("hex");
}

function hexMatches(expectedHex: string, provided: string): boolean {
  const left = Buffer.from(expectedHex, "hex");
  const right = Buffer.from(provided, "hex");
  if (left.length === 0 || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function textMatches(expected: string, provided: string): boolean {
  const left = Buffer.from(expected);
  const right = Buffer.from(provided);
  if (left.length === 0 || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function verifyQuiqupSignature(rawBody: string, request: Request): boolean {
  const secrets = [process.env.QUIQUP_WEBHOOK_SECRET, process.env.QUIQUP_API_TOKEN]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean);
  if (secrets.length === 0) return false;

  const apiKey = (request.headers.get("x-apikey") ?? request.headers.get("x-api-key") ?? "").trim();
  if (apiKey && secrets.some((secret) => textMatches(secret, apiKey))) return true;

  const header =
    request.headers.get("x-signature") ??
    request.headers.get("x-quiqup-signature") ??
    "";
  const digest = header.replace(/^(sha1|sha256)=/i, "").trim();
  if (!digest) return false;
  const timestamp = request.headers.get("x-quiqup-timestamp") ?? "";

  for (const secret of secrets) {
    if (hexMatches(hmacHex("sha1", secret, rawBody), digest)) return true;
    if (hexMatches(hmacHex("sha256", secret, rawBody), digest)) return true;
    if (timestamp && hexMatches(hmacHex("sha256", secret, `${timestamp}.${rawBody}`), digest)) return true;
  }
  return false;
}

export function shippingFromQuiqupState(state: string): string | null {
  const key = state.trim().toLowerCase().replace(/[\s-]+/g, "_");
  switch (key) {
    case "collected":
    case "picked_up":
    case "out_for_collection":
      return "picked_up";
    case "at_depot":
    case "received_at_depot":
    case "in_transit":
    case "out_for_delivery":
      return "out_for_delivery";
    case "delivery_complete":
    case "delivery_completed":
    case "delivered":
    case "delivered_to_customer":
    case "completed":
    case "complete":
    case "successful":
    case "success":
    case "dropped_off":
      return "delivered";
    case "collection_failed":
      return "collection_failed";
    case "delivery_failed":
      return "delivery_failed";
    case "return_to_origin":
      return "returning";
    case "returned_to_origin":
    case "returned":
      return "returned";
    case "cancelled":
    case "canceled":
      return "cancelled";
    case "error":
    case "problematic":
      return "rejected";
    case "ready_for_collection":
      return "label_printed";
    default:
      if (/deliver/.test(key) && /(complete|success|ed|done|drop)/.test(key)) return "delivered";
      return null;
  }
}
