export type SellerRole = "free" | "premium" | "influencer" | "vip";

export const SELLER_ROLE_OPTIONS: { id: SellerRole; label: string }[] = [
  { id: "free", label: "Free User" },
  { id: "premium", label: "Plus Member" },
  { id: "influencer", label: "Influencer" },
  { id: "vip", label: "VIP Consignment" },
];

export function canScheduleDrop(
  role: SellerRole,
  premiumUsed: boolean,
): boolean {
  if (role === "influencer" || role === "vip") return true;
  if (role === "premium") return !premiumUsed;
  return false;
}
