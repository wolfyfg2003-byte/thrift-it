import { INSPECTION_HOURS } from "@/lib/checkout";
import { getListing } from "@/lib/listings";
import { sellerPayout } from "@/lib/payout";

export const AUTO_RELEASE_HOURS = INSPECTION_HOURS;
export const AUTO_RELEASE_MS = AUTO_RELEASE_HOURS * 60 * 60 * 1000;

export type TransactionStatus = "escrow_held" | "frozen" | "completed";

export type AjexStatus =
  | "label_printed"
  | "picked_up"
  | "out_for_delivery"
  | "delivered";

export type PayoutDispatch = {
  selling_price: number;
  seller_share: number;
  concierge_share: number;
  is_consignment: boolean;
  dispatched_at: number;
  destination: "user_profiles.wallet_balance";
};

export type DisputeRecord = {
  reason: string;
  details: string;
  opened_at: number;
};

export type TransactionRecord = {
  id: string;
  listing_id: string;
  item_price: number;
  status: TransactionStatus;
  escrow_status: TransactionStatus;
  shipping_label_url: string | null;
  ajex_status: AjexStatus;
  delivered_at: number | null;
  auto_release_at: number | null;
  disputed: boolean;
  dispute: DisputeRecord | null;
  payout: PayoutDispatch | null;
  purchased_by_chat_id: string | null;
};

const TRANSACTIONS = new Map<string, TransactionRecord>();

function copy(record: TransactionRecord): TransactionRecord {
  return {
    ...record,
    dispute: record.dispute ? { ...record.dispute } : null,
    payout: record.payout ? { ...record.payout } : null,
  };
}

export function getTransaction(listingId: string): TransactionRecord | null {
  const record = TRANSACTIONS.get(listingId);
  return record ? copy(record) : null;
}

export async function createEscrowHold(input: {
  listingId: string;
  itemPrice: number;
  chatId?: string | null;
}): Promise<TransactionRecord> {
  const listing = await getListing(input.listingId);
  if (!listing) throw new Error("Listing not found.");

  const existing = TRANSACTIONS.get(input.listingId);
  if (existing) {
    throw new Error("This item has sold. Escrow is already held.");
  }

  const record: TransactionRecord = {
    id: `tx_${input.listingId}`,
    listing_id: input.listingId,
    item_price: input.itemPrice,
    status: "escrow_held",
    escrow_status: "escrow_held",
    shipping_label_url: `/labels/${input.listingId}.pdf`,
    ajex_status: "label_printed",
    delivered_at: null,
    auto_release_at: null,
    disputed: false,
    dispute: null,
    payout: null,
    purchased_by_chat_id: input.chatId ?? null,
  };
  TRANSACTIONS.set(input.listingId, record);
  return copy(record);
}

export function updateAjexStatus(
  listingId: string,
  ajex_status: AjexStatus,
): TransactionRecord | null {
  const record = TRANSACTIONS.get(listingId);
  if (!record) return null;
  if (record.status !== "escrow_held") return copy(record);

  record.ajex_status = ajex_status;
  if (ajex_status === "delivered" && !record.delivered_at) {
    const now = Date.now();
    record.delivered_at = now;
    record.auto_release_at = now + AUTO_RELEASE_MS;
  }
  return copy(record);
}

export async function completeTransaction(
  listingId: string,
  source: "buyer_accept" | "auto_release",
): Promise<TransactionRecord | null> {
  const record = TRANSACTIONS.get(listingId);
  if (!record) return null;
  if (record.status === "frozen") return copy(record);
  if (record.status === "completed") return copy(record);
  if (record.ajex_status !== "delivered") {
    throw new Error("Funds release only after AJEX marks delivered.");
  }
  if (source === "auto_release") {
    if (!record.auto_release_at || Date.now() < record.auto_release_at) {
      return copy(record);
    }
  }

  const listing = await getListing(record.listing_id);
  if (!listing) throw new Error("Listing not found.");

  const split = sellerPayout(record.item_price, listing.is_consignment);
  record.status = "completed";
  record.escrow_status = "completed";
  record.payout = {
    selling_price: split.selling_price,
    seller_share: split.seller_share,
    concierge_share: split.concierge_share,
    is_consignment: split.is_consignment,
    dispatched_at: Date.now(),
    destination: "user_profiles.wallet_balance",
  };
  return copy(record);
}

export function openDispute(
  listingId: string,
  reason: string,
  details: string,
): TransactionRecord | null {
  const record = TRANSACTIONS.get(listingId);
  if (!record) return null;
  if (record.status === "completed") return copy(record);

  record.status = "frozen";
  record.escrow_status = "frozen";
  record.disputed = true;
  record.dispute = {
    reason: reason.trim(),
    details: details.trim(),
    opened_at: Date.now(),
  };
  return copy(record);
}

export function isListingSold(listingId: string): boolean {
  return TRANSACTIONS.has(listingId);
}

export function winningChatId(listingId: string): string | null {
  return TRANSACTIONS.get(listingId)?.purchased_by_chat_id ?? null;
}

export function isChatClosedForSale(listingId: string, chatId: string): boolean {
  const record = TRANSACTIONS.get(listingId);
  if (!record) return false;
  return record.purchased_by_chat_id !== chatId;
}

export function remainingAutoReleaseMs(
  record: TransactionRecord,
  now = Date.now(),
): number {
  if (!record.auto_release_at || record.status !== "escrow_held") return 0;
  return Math.max(0, record.auto_release_at - now);
}

export function formatAutoReleaseCopy(ms: number): string {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `Auto-releasing in ${hours} hours ${minutes} minutes`;
}
