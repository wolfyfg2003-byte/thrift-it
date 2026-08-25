import { coordsForPlace, type GeoPoint } from "@/lib/geo";

export type EscrowStatus =
  | "none"
  | "escrow_held"
  | "released"
  | "completed"
  | "frozen";

export type SizeCode = "S" | "M" | "L";

export type Listing = {
  id: string;
  brand: string;
  title: string;
  size: string;
  sizeCode: SizeCode;
  location: string;
  lat: number;
  lng: number;
  condition: string;
  price: number;
  original_retail_price?: number;
  description?: string;
  material: string;
  original_photo_url: string | null;
  escrow_status: EscrowStatus;
  is_consignment: boolean;
  shipping_label_url: string | null;
  sellerUsername: string;
  /** ISO-8601 instant. Future values lock the swipe card until that time. */
  dropTime: string | null;
  isWatched: boolean;
};

/**
 * Demonstration listings only — not live inventory, customers, or press.
 */
function pin(location: string): GeoPoint {
  const point = coordsForPlace(location);
  if (!point) {
    throw new Error(`Missing demonstration coordinates for ${location}`);
  }
  return point;
}

export const LIVE_CLOSET_DROP_ID = "zimmermann-floral";
export const LIVE_CLOSET_DROP_MS = 30_000;

/** Offsets from page load. Home rail restamps these so the demo can be replayed. */
export const DROP_SCHEDULE: Record<string, number> = {
  "zimmermann-floral": LIVE_CLOSET_DROP_MS,
  "self-portrait-boucle": 60 * 60 * 1000,
  "downtown-02": 5 * 60 * 60 * 1000,
};

const CATALOG: Listing[] = [
  {
    id: "marina-01",
    brand: "Atelier Noor",
    title: "Sand silk midi",
    size: "M / UK 10",
    sizeCode: "M",
    location: "Dubai Marina",
    ...pin("Dubai Marina"),
    condition: "Excellent",
    price: 980,
    original_retail_price: 2400,
    description: "Worn once to a DIFC dinner. Bias silk, still warm in Marina light.",
    material: "Silk",
    original_photo_url: "/deck/atelier-noor.png",
    escrow_status: "none",
    is_consignment: false,
    shipping_label_url: null,
    sellerUsername: "sarah-dxb",
    dropTime: null,
    isWatched: false,
  },
  {
    id: "downtown-02",
    brand: "Maison Hana",
    title: "Ivory tailored set",
    size: "S / UK 8",
    sizeCode: "S",
    location: "Downtown Dubai",
    ...pin("Downtown Dubai"),
    condition: "Like new",
    price: 1450,
    original_retail_price: 3200,
    description: "Sharp ivory tailoring. Dry cleaned, hanging in Downtown.",
    material: "See the garment label",
    original_photo_url: "/deck/maison-hana.png",
    escrow_status: "none",
    is_consignment: true,
    shipping_label_url: null,
    sellerUsername: "noor-jlt",
    dropTime: new Date(Date.now() + DROP_SCHEDULE["downtown-02"]).toISOString(),
    isWatched: false,
  },
  {
    id: "jumeirah-03",
    brand: "Lumen Modest",
    title: "Charcoal abaya coat",
    size: "L / UK 14",
    sizeCode: "L",
    location: "Jumeirah",
    ...pin("Jumeirah"),
    condition: "New with tags",
    price: 720,
    original_retail_price: 1650,
    description: "New with tags. Cut for evening air in Jumeirah.",
    material: "See the garment label",
    original_photo_url: "/deck/lumen-modest.png",
    escrow_status: "none",
    is_consignment: false,
    shipping_label_url: null,
    sellerUsername: "sarah-dxb",
    dropTime: null,
    isWatched: false,
  },
  {
    id: "zimmermann-floral",
    brand: "Zimmermann",
    title: "Floral maxi",
    size: "1 / AU 8",
    sizeCode: "S",
    location: "Palm Jumeirah",
    ...pin("Palm Jumeirah"),
    condition: "Excellent",
    price: 2400,
    original_retail_price: 4800,
    description: "Garden florals, one wedding, then the closet.",
    material: "See the garment label",
    original_photo_url: "/deck/zimmermann-floral.png",
    escrow_status: "none",
    is_consignment: true,
    shipping_label_url: null,
    sellerUsername: "amna-m",
    dropTime: new Date(Date.now() + LIVE_CLOSET_DROP_MS).toISOString(),
    isWatched: false,
  },
  {
    id: "self-portrait-boucle",
    brand: "Self-Portrait",
    title: "Bouclé dress",
    size: "UK 10",
    sizeCode: "M",
    location: "Al Barsha",
    ...pin("Al Barsha"),
    condition: "Excellent",
    price: 890,
    original_retail_price: 2100,
    description: "Tactile bouclé. Photographed this morning in Al Barsha.",
    material: "Bouclé",
    original_photo_url: "/deck/self-portrait-boucle.png",
    escrow_status: "none",
    is_consignment: true,
    shipping_label_url: null,
    sellerUsername: "noor-jlt",
    dropTime: new Date(Date.now() + DROP_SCHEDULE["self-portrait-boucle"]).toISOString(),
    isWatched: false,
  },
  {
    id: "house-of-cb",
    brand: "House of CB",
    title: "Structured midi",
    size: "S",
    sizeCode: "S",
    location: "JVC",
    ...pin("JVC"),
    condition: "Pristine",
    price: 450,
    original_retail_price: 980,
    description: "Structured midi. One night out, then hanging in JVC.",
    material: "See the garment label",
    original_photo_url: "/deck/house-of-cb.png",
    escrow_status: "none",
    is_consignment: true,
    shipping_label_url: null,
    sellerUsername: "amna-m",
    dropTime: null,
    isWatched: false,
  },
];

export function stampDropSchedule(
  listings: Listing[],
  originMs: number,
  watchedIds: readonly string[] = [],
): Listing[] {
  const watched = new Set(watchedIds);
  return listings.map((item) => {
    const offset = DROP_SCHEDULE[item.id];
    return {
      ...item,
      dropTime:
        offset == null ? null : new Date(originMs + offset).toISOString(),
      isWatched: watched.has(item.id),
    };
  });
}

function withFreshDrop(item: Listing): Listing {
  const offset = DROP_SCHEDULE[item.id];
  if (offset == null) return { ...item, dropTime: null, isWatched: false };
  return {
    ...item,
    dropTime: new Date(Date.now() + offset).toISOString(),
    isWatched: false,
  };
}

export type PreviewPlate = {
  id: string;
  brand: string;
  title: string;
  size: string;
  location: string;
  price: number;
  original_retail_price?: number;
  original_photo_url: string;
};

const PREVIEW_ORDER = [
  "zimmermann-floral",
  "self-portrait-boucle",
  "house-of-cb",
  "marina-01",
] as const;

export type TeaserDeckData = {
  first: PreviewPlate;
  second: PreviewPlate;
  mysteryPhoto: string;
};

function plateById(id: string): PreviewPlate | null {
  const item = CATALOG.find((row) => row.id === id);
  if (!item?.original_photo_url) return null;
  return {
    id: item.id,
    brand: item.brand,
    title: item.title,
    size: item.size,
    location: item.location,
    price: item.price,
    original_retail_price: item.original_retail_price,
    original_photo_url: item.original_photo_url,
  };
}

/** Two demonstration garments plus a mystery plate for the landing teaser. */
export function getTeaserDeck(): TeaserDeckData | null {
  const first = plateById("zimmermann-floral");
  const second = plateById("house-of-cb");
  const mystery = plateById("self-portrait-boucle");
  if (!first || !second || !mystery) return null;
  return { first, second, mysteryPhoto: mystery.original_photo_url };
}

/** Frozen camera plates for the website phone preview — no drop restamping. */
export function listPreviewPlates(): PreviewPlate[] {
  return PREVIEW_ORDER.flatMap((id) => {
    const item = CATALOG.find((row) => row.id === id);
    if (!item?.original_photo_url) return [];
    return [
      {
        id: item.id,
        brand: item.brand,
        title: item.title,
        size: item.size,
        location: item.location,
        price: item.price,
        original_retail_price: item.original_retail_price,
        original_photo_url: item.original_photo_url,
      },
    ];
  });
}

export async function getListing(id: string): Promise<Listing | null> {
  const listing = CATALOG.find((item) => item.id === id) ?? null;
  return listing ? withFreshDrop(listing) : null;
}

export async function listListings(): Promise<Listing[]> {
  return CATALOG.map((item) => withFreshDrop(item));
}

export async function listListingsBySeller(username: string): Promise<Listing[]> {
  const slug = username.replace(/^@/, "").toLowerCase().replace(/_/g, "-");
  return CATALOG.filter((item) => item.sellerUsername === slug).map((item) =>
    withFreshDrop(item),
  );
}

export function listingSelect() {
  return "id, brand, title, size, condition, price, original_photo_url, escrow_status, is_consignment, shipping_label_url, location";
}
