export function sellerPayout(sellingPrice: number, vip: boolean) {
  const selling_price = Math.max(0, Math.round(Number.isFinite(sellingPrice) ? sellingPrice : 0));
  if (vip) {
    const seller_share = Math.round(selling_price * 0.5);
    return {
      selling_price,
      is_consignment: true as const,
      seller_share,
      concierge_share: selling_price - seller_share,
      seller_rate: 0.5 as const,
    };
  }
  return {
    selling_price,
    is_consignment: false as const,
    seller_share: selling_price,
    concierge_share: 0,
    seller_rate: 1 as const,
  };
}
