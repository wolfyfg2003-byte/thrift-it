import { useSyncExternalStore } from "react";

export type ListingSale = {
  listingId: string;
  winningChatId: string | null;
};

const STORAGE_KEY = "thrift-it-listing-sales";
const listeners = new Set<() => void>();
let sales: Record<string, ListingSale> = {};
let restored = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
  } catch {
    /* private mode */
  }
}

export function restoreListingSales() {
  if (restored || typeof window === "undefined") return;
  restored = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, ListingSale>;
    if (parsed && typeof parsed === "object") {
      sales = parsed;
      emit();
    }
  } catch {
    /* ignore */
  }
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      const parsed = JSON.parse(event.newValue) as Record<string, ListingSale>;
      sales = parsed;
      emit();
    } catch {
      /* ignore */
    }
  });
}

export function getListingSales(): Record<string, ListingSale> {
  return sales;
}

export function subscribeListingSales(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function markListingSold(listingId: string, winningChatId: string | null) {
  sales = {
    ...sales,
    [listingId]: { listingId, winningChatId },
  };
  persist();
  emit();
}

export function hydrateListingSale(sale: ListingSale) {
  markListingSold(sale.listingId, sale.winningChatId);
}

export async function syncListingSaleFromServer(listingId: string) {
  const response = await fetch(
    `/api/payment/status?listingId=${encodeURIComponent(listingId)}`,
  );
  const data = (await response.json()) as {
    transaction?: {
      listing_id: string;
      purchased_by_chat_id: string | null;
    } | null;
  };
  if (!data.transaction) return;
  markListingSold(data.transaction.listing_id, data.transaction.purchased_by_chat_id);
}

export function isThreadClosed(listingId: string, chatId: string): boolean {
  const sale = sales[listingId];
  if (!sale) return false;
  return sale.winningChatId !== chatId;
}

export function useListingSales(): Record<string, ListingSale> {
  return useSyncExternalStore(subscribeListingSales, getListingSales, getListingSales);
}

export function useThreadClosed(listingId: string, chatId: string): boolean {
  const snapshot = useListingSales();
  const sale = snapshot[listingId];
  if (!sale) return false;
  return sale.winningChatId !== chatId;
}
