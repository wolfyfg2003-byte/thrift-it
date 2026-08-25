export const BUYER_PROTECTION_RATE = 0.2;
export const BUYER_SHIPPING_AED = 20;
export const AJEX_BULK_AED = 14;
export const SHIPPING_MARGIN_AED = BUYER_SHIPPING_AED - AJEX_BULK_AED;
export const INSPECTION_HOURS = 12;

export type CheckoutQuote = {
  item_price: number;
  buyer_protection_fee: number;
  shipping_fee: number;
  total_charge: number;
  ajex_bulk_cost: number;
  shipping_margin: number;
};

export function quoteCheckout(itemPrice: number): CheckoutQuote {
  const item_price = Math.max(0, Math.round(itemPrice));
  const buyer_protection_fee = Math.round(item_price * BUYER_PROTECTION_RATE);
  const shipping_fee = BUYER_SHIPPING_AED;
  return {
    item_price,
    buyer_protection_fee,
    shipping_fee,
    total_charge: item_price + buyer_protection_fee + shipping_fee,
    ajex_bulk_cost: AJEX_BULK_AED,
    shipping_margin: SHIPPING_MARGIN_AED,
  };
}

export function formatAed(amount: number): string {
  return `AED ${Math.round(amount).toLocaleString("en-US")}`;
}
