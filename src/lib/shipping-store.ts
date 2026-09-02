import { useSyncExternalStore } from "react";
import {
  EMPTY_SHIPPING,
  EMIRATES,
  type Emirate,
  type ShippingAddress,
} from "@/lib/uae-address";

const STORAGE_KEY = "thrift-it-shipping";
const listeners = new Set<() => void>();

let shipping: ShippingAddress = { ...EMPTY_SHIPPING };
let restored = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(shipping));
  emit();
}

function asShipping(value: unknown): ShippingAddress {
  if (!value || typeof value !== "object") return { ...EMPTY_SHIPPING };
  const raw = value as Partial<ShippingAddress>;
  const emirate = EMIRATES.includes(raw.emirate as Emirate)
    ? (raw.emirate as Emirate)
    : EMPTY_SHIPPING.emirate;
  return {
    emirate,
    community: typeof raw.community === "string" ? raw.community : "",
    street: typeof raw.street === "string" ? raw.street : "",
    unit: typeof raw.unit === "string" ? raw.unit : "",
    mobile: typeof raw.mobile === "string" ? raw.mobile : "",
    building: typeof raw.building === "string" ? raw.building : "",
    lat: typeof raw.lat === "number" ? raw.lat : null,
    lng: typeof raw.lng === "number" ? raw.lng : null,
  };
}

export function restoreShipping() {
  if (restored || typeof window === "undefined") return;
  restored = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) shipping = asShipping(JSON.parse(raw));
  } catch {
    shipping = { ...EMPTY_SHIPPING };
  }
  emit();
}

export function getShipping(): ShippingAddress {
  return shipping;
}

export function subscribeShipping(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function saveShipping(next: ShippingAddress) {
  shipping = asShipping(next);
  persist();
}

export function useShipping(): ShippingAddress {
  return useSyncExternalStore(subscribeShipping, getShipping, () => EMPTY_SHIPPING);
}
