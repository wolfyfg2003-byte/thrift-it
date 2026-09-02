import type { Listing, SizeCode } from "@/lib/listings";

export const TASTE_SIZES = ["XS", "S", "M", "L", "XL"] as const;
export type TasteSize = (typeof TASTE_SIZES)[number];

export const TASTE_BRANDS = [
  "Zimmermann",
  "House of CB",
  "Self-Portrait",
  "Atelier Noor",
  "Maison Hana",
  "Lumen Modest",
  "Chanel",
  "Jacquemus",
  "Dior",
] as const;
export type TasteBrand = (typeof TASTE_BRANDS)[number];

export const TASTE_AESTHETICS = [
  {
    id: "contemporary_chic",
    label: "Contemporary Chic",
    line: "Clean lines, resort silk, Friday tables.",
    image: "/deck/atelier-noor.png",
    crop: "50% 40%",
    frame: "polaroid",
  },
  {
    id: "y2k_vintage",
    label: "Y2K Vintage",
    line: "Structured minis, archival cut-outs.",
    image: "/deck/house-of-cb.png",
    crop: "50% 18%",
    frame: "polaroid",
  },
  {
    id: "modest_couture",
    label: "Modest Couture",
    line: "Abaya coats, covered evening.",
    image: "/deck/lumen-modest.png",
    crop: "68% 38%",
    frame: "polaroid",
  },
  {
    id: "luxury_archives",
    label: "Luxury Archives",
    line: "Tailoring and house codes that hold value.",
    image: "/deck/maison-hana.png",
    crop: "42% 28%",
    frame: "clipping",
  },
] as const;

export type TasteAestheticId = (typeof TASTE_AESTHETICS)[number]["id"];

export const DUBAI_COMMUNITIES = [
  "Dubai Marina",
  "Downtown Dubai",
  "JLT",
  "JVC",
  "Jumeirah",
] as const;
export type DubaiCommunity = (typeof DUBAI_COMMUNITIES)[number];

export type TastePreferences = {
  sizes: string[];
  brands: Record<string, number>;
  categories: Record<string, number>;
};

export const EMPTY_TASTE: TastePreferences = {
  sizes: [],
  brands: {},
  categories: {},
};

export const SELECTED_BRAND_WEIGHT = 5;

export function listingCategory(
  listing: Pick<Listing, "title" | "material" | "brand">,
): string {
  const hay = `${listing.brand} ${listing.title} ${listing.material}`.toLowerCase();
  if (
    hay.includes("abaya") ||
    hay.includes("modest") ||
    hay.includes("lumen")
  ) {
    return "modest_couture";
  }
  if (hay.includes("house of cb") || hay.includes("structured midi")) {
    return "y2k_vintage";
  }
  if (
    hay.includes("chanel") ||
    hay.includes("dior") ||
    hay.includes("jacquemus") ||
    hay.includes("maison hana") ||
    hay.includes("self-portrait") ||
    hay.includes("bouclé") ||
    hay.includes("boucle") ||
    hay.includes("tailored")
  ) {
    return "luxury_archives";
  }
  return "contemporary_chic";
}

export function buildInitialTaste(
  sizes: string[],
  selectedBrands: string[],
  aesthetics: string[] = [],
): TastePreferences {
  const brands: Record<string, number> = {};
  for (const brand of selectedBrands) {
    const label = brand.trim();
    if (label) brands[label] = SELECTED_BRAND_WEIGHT;
  }
  const categories: Record<string, number> = {};
  for (const mood of aesthetics) {
    const key = mood.trim();
    if (key) categories[key] = SELECTED_BRAND_WEIGHT;
  }
  return {
    sizes: [...sizes],
    brands,
    categories,
  };
}

export type TasteEvent = "like" | "pass" | "offer";

export function applyTasteWeights(
  current: TastePreferences,
  brand: string,
  category: string,
  event: TasteEvent,
): TastePreferences {
  const brands = { ...current.brands };
  const categories = { ...current.categories };
  const brandWeight = brands[brand] ?? 0;
  const categoryWeight = categories[category] ?? 0;

  if (event === "like") {
    brands[brand] = brandWeight + 1;
    categories[category] = categoryWeight + 1;
  } else if (event === "pass") {
    brands[brand] = brandWeight - 0.5;
    categories[category] = categoryWeight - 0.5;
  } else {
    brands[brand] = brandWeight * 2;
    categories[category] = categoryWeight * 2;
  }

  return { ...current, brands, categories };
}

export function tasteScore(
  listing: Listing,
  prefs: TastePreferences,
): number {
  const brandWeight = prefs.brands[listing.brand] ?? 0;
  const categoryWeight = prefs.categories[listingCategory(listing)] ?? 0;
  return brandWeight * 1.5 + categoryWeight * 1;
}

function sizeAliases(code: SizeCode): string[] {
  if (code === "S") return ["XS", "S"];
  if (code === "M") return ["M"];
  return ["L", "XL"];
}

export function listingMatchesTasteSizes(
  listing: Listing,
  sizes: string[],
): boolean {
  if (sizes.length === 0) return true;
  const wanted = new Set(sizes.map((size) => size.toUpperCase()));
  return sizeAliases(listing.sizeCode).some((alias) => wanted.has(alias));
}

export function rankListingsByTaste(
  listings: Listing[],
  prefs: TastePreferences,
  swipedIds: ReadonlySet<string>,
): Listing[] {
  return listings
    .filter((item) => listingMatchesTasteSizes(item, prefs.sizes))
    .filter((item) => !swipedIds.has(item.id))
    .slice()
    .sort((a, b) => tasteScore(b, prefs) - tasteScore(a, prefs));
}

export function isTasteCalibrated(prefs: TastePreferences): boolean {
  return (
    Object.values(prefs.brands).some((weight) => weight > 0) ||
    Object.values(prefs.categories).some((weight) => weight > 0)
  );
}
