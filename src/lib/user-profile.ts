export type SellerReviewOfBuyer = {
  id: string;
  sellerHandle: string;
  sellerUsername: string;
  listingTitle: string;
  body: string;
  rating: number;
  date: string;
};

export type BuyerProfile = {
  handle: string;
  initials: string;
  portraitUrl: string;
  location: string;
  bio: string;
  styleTags: string[];
  dressSize: string;
  shoeSize: string;
  wardrobesDetoxed: number;
  gemsSaved: number;
  likedListingIds: string[];
  sellerReviews: SellerReviewOfBuyer[];
};

/**
 * Demonstration buyer profile — not live sales, follows, or seller reviews.
 */
export const BUYER_PROFILE: BuyerProfile = {
  handle: "@Jaze_DXB",
  initials: "JZ",
  portraitUrl: "/profile/jaze-dxb.png",
  location: "Dubai Marina",
  bio: "I keep a tight rail: modest silk that still moves in Marina air, resort pieces for Friday tables, and blazers that sit clean over a longer layer. Honest photographs and Mamo escrow — then I buy.",
  styleTags: ["Modest Silk", "Contemporary Resort", "Tailored Blazers"],
  dressSize: "FR 36 / US S",
  shoeSize: "EU 38",
  wardrobesDetoxed: 4,
  gemsSaved: 6,
  likedListingIds: [
    "house-of-cb",
    "marina-01",
    "zimmermann-floral",
    "jumeirah-03",
    "self-portrait-boucle",
  ],
  sellerReviews: [
    {
      id: "sr1",
      sellerHandle: "@Sarah_DXB",
      sellerUsername: "sarah-dxb",
      listingTitle: "Sand silk midi",
      body: "Paid into escrow the same afternoon. Knew her size without asking twice.",
      rating: 5,
      date: "Apr",
    },
    {
      id: "sr2",
      sellerHandle: "@Amna_M",
      sellerUsername: "amna-m",
      listingTitle: "Structured midi",
      body: "Offer at the floor, then Mamo Pay. Packed for AJEX without a chase.",
      rating: 5,
      date: "Mar",
    },
    {
      id: "sr3",
      sellerHandle: "@Noor_JLT",
      sellerUsername: "noor-jlt",
      listingTitle: "Ivory tailored set",
      body: "Asked for extra lining photos. Fair, if particular. Escrow cleared on time.",
      rating: 4,
      date: "Feb",
    },
  ],
};
