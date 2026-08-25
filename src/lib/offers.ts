export const OFFER_FLOOR_RATIO = 0.8;
export const OFFER_EXPIRY_HOURS = 24;

export const OFFER_FLOOR_ERROR =
  "To respect our sellers' time, offers must be at least 80% of the asking price.";

export function getOfferFloor(askingPrice: number): number {
  if (!Number.isFinite(askingPrice) || askingPrice <= 0) return 0;
  return Math.ceil(askingPrice * OFFER_FLOOR_RATIO);
}

export function isOfferAtOrAboveFloor(offeredPrice: number, askingPrice: number): boolean {
  return offeredPrice >= getOfferFloor(askingPrice);
}

export function percentOff(askingPrice: number, offeredPrice: number): number {
  if (!Number.isFinite(askingPrice) || askingPrice <= 0) return 0;
  return Math.max(0, Math.round(((askingPrice - offeredPrice) / askingPrice) * 100));
}
