import { filterBrands } from "@/lib/brands";
import { withinRadius, type GeoPoint } from "@/lib/geo";
import type { Listing, SizeCode } from "@/lib/listings";

export type DeckCircle = "for-you" | "following";

export const DECK_CIRCLES: { id: DeckCircle; label: string }[] = [
  { id: "for-you", label: "For You" },
  { id: "following", label: "Following" },
];

export type SizeSystem = "standard" | "ukau" | "eufr";

export const SIZE_TABS: { id: SizeSystem; label: string }[] = [
  { id: "standard", label: "Standard" },
  { id: "ukau", label: "UK/AU" },
  { id: "eufr", label: "EU/FR" },
];

export const SIZE_PILLS: Record<SizeSystem, { value: string; label: string }[]> = {
  standard: ["XS", "S", "M", "L", "XL", "XXL"].map((value) => ({
    value,
    label: value,
  })),
  ukau: ["4", "6", "8", "10", "12", "14", "16", "18"].map((value) => ({
    value,
    label: `UK ${value}`,
  })),
  eufr: ["32", "34", "36", "38", "40", "42", "44", "46"].map((value) => ({
    value,
    label: value,
  })),
};

type SizeEquivalents = {
  standard: string;
  ukau: string;
  eufr: string;
};

const FROM_STANDARD: Record<SizeCode, SizeEquivalents> = {
  S: { standard: "S", ukau: "8", eufr: "36" },
  M: { standard: "M", ukau: "10", eufr: "38" },
  L: { standard: "L", ukau: "14", eufr: "42" },
};

export type DeckFilters = {
  query: string;
  brands: string[];
  sizes: string[];
  radiusKm: number | null;
};

export const EMPTY_FILTERS: DeckFilters = {
  query: "",
  brands: [],
  sizes: [],
  radiusKm: null,
};

export function sizeKey(system: SizeSystem, value: string): string {
  return `${system}:${value}`;
}

export function parseSizeKey(key: string): { system: SizeSystem; value: string } | null {
  const [system, value] = key.split(":");
  if ((system === "standard" || system === "ukau" || system === "eufr") && value) {
    return { system, value };
  }
  return null;
}

export function formatSizeKeyLabel(key: string): string {
  const parsed = parseSizeKey(key);
  if (!parsed) return key;
  const pill = SIZE_PILLS[parsed.system].find((item) => item.value === parsed.value);
  if (parsed.system === "eufr") return `EU ${parsed.value}`;
  if (parsed.system === "standard") return pill?.label ?? parsed.value;
  return pill?.label ?? `UK ${parsed.value}`;
}

export function defaultDressSizeKey(code: SizeCode): string {
  return sizeKey("standard", code);
}

export function sizeKeyToDressCode(key: string): SizeCode | null {
  const parsed = parseSizeKey(key);
  if (!parsed) return null;
  if (parsed.system === "standard") {
    if (parsed.value === "XS" || parsed.value === "S") return "S";
    if (parsed.value === "M") return "M";
    if (parsed.value === "L" || parsed.value === "XL" || parsed.value === "XXL") return "L";
  }
  if (parsed.system === "ukau") {
    const n = Number(parsed.value);
    if (n <= 8) return "S";
    if (n <= 12) return "M";
    return "L";
  }
  const n = Number(parsed.value);
  if (n <= 36) return "S";
  if (n <= 40) return "M";
  return "L";
}

function parseExplicitSize(raw: string): Partial<SizeEquivalents> {
  const text = raw.toUpperCase();
  const uk = text.match(/\bUK\s*(\d{1,2})\b/);
  const au = text.match(/\bAU\s*(\d{1,2})\b/);
  const fr = text.match(/\bFR\s*(\d{2})\b/);
  const eu = text.match(/\bEU\s*(\d{2})\b/);
  const next: Partial<SizeEquivalents> = {};
  if (uk) next.ukau = uk[1];
  if (au) next.ukau = au[1];
  if (fr) next.eufr = fr[1];
  if (eu) next.eufr = eu[1];
  return next;
}

export function listingSizeKeys(listing: Listing): Set<string> {
  const base = FROM_STANDARD[listing.sizeCode];
  const explicit = parseExplicitSize(listing.size);
  const keys = new Set<string>();
  keys.add(sizeKey("standard", explicit.standard ?? base.standard));
  keys.add(sizeKey("ukau", explicit.ukau ?? base.ukau));
  keys.add(sizeKey("eufr", explicit.eufr ?? base.eufr));
  return keys;
}

export function filtersAreActive(filters: DeckFilters): boolean {
  return (
    filters.query.trim().length > 0 ||
    filters.brands.length > 0 ||
    filters.sizes.length > 0 ||
    filters.radiusKm != null
  );
}

export function filterListings(
  listings: Listing[],
  filters: DeckFilters,
  options: {
    circle?: DeckCircle;
    following?: string[];
    origin?: GeoPoint | null;
  } = {},
): Listing[] {
  const needle = filters.query.trim().toLowerCase();
  const following = new Set(options.following ?? []);
  const circle = options.circle ?? "for-you";
  const brandSet = new Set(filters.brands.map((brand) => brand.toLowerCase()));
  const origin = options.origin ?? null;

  return listings.filter((item) => {
    if (circle === "following") {
      if (following.size === 0 || !following.has(item.sellerUsername)) return false;
    }
    if (needle) {
      const hay = `${item.brand} ${item.title} ${item.description ?? ""} ${item.location}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    if (brandSet.size > 0 && !brandSet.has(item.brand.toLowerCase())) {
      return false;
    }
    if (filters.sizes.length > 0) {
      const tokens = listingSizeKeys(item);
      if (!filters.sizes.some((key) => tokens.has(key))) return false;
    }
    if (filters.radiusKm != null && origin) {
      if (
        !withinRadius(origin, { lat: item.lat, lng: item.lng }, filters.radiusKm)
      ) {
        return false;
      }
    }
    return true;
  });
}

export function toggleValue<T extends string>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export { filterBrands };
