export type SellerReview = {
  id: string;
  buyerHandle: string;
  body: string;
  rating: number;
  date: string;
};

export type SellerProfile = {
  username: string;
  handle: string;
  initials: string;
  location: string;
  followers: number;
  rating: number;
  reviewCount: number;
  bio: string;
  reviews: SellerReview[];
};

/**
 * Demonstration seller closets — not live customers, followers, or press.
 */
const SELLERS: SellerProfile[] = [
  {
    username: "sarah-dxb",
    handle: "@Sarah_DXB",
    initials: "SD",
    location: "Dubai Marina",
    followers: 842,
    rating: 4.9,
    reviewCount: 28,
    bio: "Marina closet, photographed on the balcony. Escrow only.",
    reviews: [
      {
        id: "r1",
        buyerHandle: "@Lina_Marina",
        body: "Midi arrived steamed, colour warmer than the listing. AJEX was on time.",
        rating: 5,
        date: "Mar",
      },
      {
        id: "r2",
        buyerHandle: "@Noor_JLT",
        body: "Honest about the one dinner wear. Bag and spare hook were in the parcel.",
        rating: 5,
        date: "Feb",
      },
      {
        id: "r3",
        buyerHandle: "@Hana_DT",
        body: "Replied the same afternoon. Fit true to the UK 10 note.",
        rating: 4,
        date: "Jan",
      },
    ],
  },
  {
    username: "amna-m",
    handle: "@Amna_M",
    initials: "AM",
    location: "Palm Jumeirah",
    followers: 416,
    rating: 4.8,
    reviewCount: 14,
    bio: "Palm closet. Structured pieces, one night out, then the rail.",
    reviews: [
      {
        id: "a1",
        buyerHandle: "@You",
        body: "House of CB midi was pristine. Offered at the floor and she took escrow.",
        rating: 5,
        date: "Apr",
      },
      {
        id: "a2",
        buyerHandle: "@Lina_Marina",
        body: "Floral packing was careful. Slightly slower to reply than Sarah.",
        rating: 4,
        date: "Feb",
      },
    ],
  },
  {
    username: "noor-jlt",
    handle: "@Noor_JLT",
    initials: "NJ",
    location: "Downtown Dubai",
    followers: 193,
    rating: 5,
    reviewCount: 9,
    bio: "Downtown rail. Tailoring and bouclé, dry cleaned before it leaves.",
    reviews: [
      {
        id: "n1",
        buyerHandle: "@Amna_M",
        body: "Ivory set as sharp as the photo. Escrow released the same evening I accepted.",
        rating: 5,
        date: "Apr",
      },
      {
        id: "n2",
        buyerHandle: "@Sarah_DXB",
        body: "Bouclé had no pills. Label still on the spare button.",
        rating: 5,
        date: "Mar",
      },
    ],
  },
];

export function sellerSlug(value: string): string {
  return value.replace(/^@/, "").trim().toLowerCase().replace(/_/g, "-");
}

export function sellerPath(username: string): string {
  return `/seller/${sellerSlug(username)}`;
}

export function formatFollowers(count: number): string {
  if (count >= 1000) {
    const compact = count / 1000;
    return `${compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1)}k`;
  }
  return count.toLocaleString("en-US");
}

export function findSeller(username: string): SellerProfile | null {
  const slug = sellerSlug(username);
  const seller = SELLERS.find((item) => item.username === slug) ?? null;
  return seller
    ? { ...seller, reviews: seller.reviews.map((review) => ({ ...review })) }
    : null;
}

export async function getSeller(username: string): Promise<SellerProfile | null> {
  return findSeller(username);
}

export async function getSellerByListing(
  sellerUsername: string,
): Promise<SellerProfile | null> {
  return getSeller(sellerUsername);
}
