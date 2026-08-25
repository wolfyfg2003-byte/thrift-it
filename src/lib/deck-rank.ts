import { listingSizeKeys, sizeKeyToDressCode } from "@/lib/filters";
import { coordsForPlace, haversineKm, type GeoPoint } from "@/lib/geo";
import type { Listing, SizeCode } from "@/lib/listings";
import { boostExpiresAt } from "@/lib/plus-store";

export const DRESS_SIZE_LABELS: Record<SizeCode, string> = {
  S: "FR 36 / US S",
  M: "FR 38 / US M",
  L: "FR 40 / US L",
};

function normalizePlace(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function shippingDistanceKm(
  listingLocation: string,
  buyerCommunity: string,
): number {
  if (normalizePlace(listingLocation) === normalizePlace(buyerCommunity)) return 0;
  const from = coordsForPlace(buyerCommunity);
  const to = coordsForPlace(listingLocation);
  if (!from || !to) return 80;
  return haversineKm(from, to);
}

export function listingDistanceKm(listing: Listing, origin: GeoPoint): number {
  return haversineKm(origin, { lat: listing.lat, lng: listing.lng });
}

export function locationBadge(
  listingLocation: string,
  buyerCommunity: string,
): string {
  if (!buyerCommunity.trim()) return listingLocation;
  if (normalizePlace(listingLocation) === normalizePlace(buyerCommunity)) {
    return `Near you in ${buyerCommunity}`;
  }
  return listingLocation;
}

export function matchesDressSize(listing: Listing, dressSizeKey: string): boolean {
  if (listingSizeKeys(listing).has(dressSizeKey)) return true;
  const code = sizeKeyToDressCode(dressSizeKey);
  return code ? listing.sizeCode === code : false;
}

export function rankDeck(
  listings: Listing[],
  options: {
    dressSize: SizeCode;
    dressSizeKey?: string;
    community: string;
    origin?: GeoPoint | null;
    mySizeOnly?: boolean;
    now?: number;
  },
): Listing[] {
  const now = options.now ?? Date.now();
  const sizeKey = options.dressSizeKey ?? `standard:${options.dressSize}`;
  const pool = options.mySizeOnly
    ? listings.filter((item) => matchesDressSize(item, sizeKey))
    : listings;

  return pool
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const aBoost = boostExpiresAt(a.item.id, now) ?? 0;
      const bBoost = boostExpiresAt(b.item.id, now) ?? 0;
      if (aBoost !== bBoost) return bBoost - aBoost;

      const aFit = matchesDressSize(a.item, sizeKey) ? 0 : 1;
      const bFit = matchesDressSize(b.item, sizeKey) ? 0 : 1;
      if (aFit !== bFit) return aFit - bFit;

      const aKm = options.origin
        ? listingDistanceKm(a.item, options.origin)
        : shippingDistanceKm(a.item.location, options.community);
      const bKm = options.origin
        ? listingDistanceKm(b.item, options.origin)
        : shippingDistanceKm(b.item.location, options.community);
      if (aKm !== bKm) return aKm - bKm;

      return a.index - b.index;
    })
    .map((entry) => entry.item);
}
