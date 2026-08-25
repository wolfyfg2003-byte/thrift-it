import type { Listing } from "@/lib/listings";
import { getListing } from "@/lib/listings";

export type ChatRole = "buyer" | "seller";
export type InboxSide = "buying" | "selling";
export type InboxStatus = "pending" | "accepted" | "shipped" | "sold_out";

export type ChatMessage = {
  id: string;
  from: ChatRole;
  text: string;
  time: string;
};

export type ChatPerson = {
  handle: string;
  initials: string;
  responseRate: string;
};

export type ChatThread = {
  id: string;
  listingId: string;
  side: InboxSide;
  viewer: ChatRole;
  status: InboxStatus;
  yourTurn: boolean;
  seller: ChatPerson;
  buyer: ChatPerson;
  offerAmount: number;
  lastMessage: string;
  lastAt: string;
  messages: ChatMessage[];
};

export type InboxRow = ChatThread & { listing: Listing | null };

const THREADS: ChatThread[] = [
  {
    id: "amna-cb",
    listingId: "house-of-cb",
    side: "buying",
    viewer: "buyer",
    status: "pending",
    yourTurn: true,
    seller: {
      handle: "@Amna_M",
      initials: "AM",
      responseRate: "96% response · usually 40m",
    },
    buyer: {
      handle: "@You",
      initials: "YO",
      responseRate: "—",
    },
    offerAmount: 360,
    lastMessage: "Offer sent — 80% of asking, still in escrow range.",
    lastAt: "12m",
    messages: [
      {
        id: "b1",
        from: "buyer",
        text: "Swiped right on the midi. Offering at the floor if you’ll take escrow.",
        time: "12m",
      },
      {
        id: "b2",
        from: "seller",
        text: "It’s pristine — one night only. I’ll look at a fair number.",
        time: "8m",
      },
    ],
  },
  {
    id: "sarah-dxb",
    listingId: "marina-01",
    side: "buying",
    viewer: "buyer",
    status: "accepted",
    yourTurn: true,
    seller: {
      handle: "@Sarah_DXB",
      initials: "SD",
      responseRate: "94% response · usually 1h",
    },
    buyer: {
      handle: "@You",
      initials: "YO",
      responseRate: "—",
    },
    offerAmount: 850,
    lastMessage: "Accepted. Pay into escrow before the 24h lock lifts.",
    lastAt: "1h",
    messages: [
      {
        id: "m1",
        from: "buyer",
        text: "Still available? DIFC wedding next month — escrow only, no meetup.",
        time: "Yesterday",
      },
      {
        id: "m2",
        from: "seller",
        text: "Yes. Worn once, dry cleaned. Bag and spare hook are with it.",
        time: "Yesterday",
      },
      {
        id: "m3",
        from: "buyer",
        text: "Sending an offer. Happy to pay into Mamo Pay if you accept.",
        time: "1h",
      },
    ],
  },
  {
    id: "lina-zimmermann",
    listingId: "zimmermann-floral",
    side: "selling",
    viewer: "seller",
    status: "pending",
    yourTurn: true,
    seller: {
      handle: "@You",
      initials: "YO",
      responseRate: "—",
    },
    buyer: {
      handle: "@Lina_Marina",
      initials: "LM",
      responseRate: "91% response · usually 2h",
    },
    offerAmount: 2100,
    lastMessage: "Would you take AED 2,100? Escrow and AJEX from Marina.",
    lastAt: "3h",
    messages: [
      {
        id: "s1",
        from: "buyer",
        text: "The floral is still up? I can do escrow this week.",
        time: "Yesterday",
      },
      {
        id: "s2",
        from: "seller",
        text: "It is. Photographed in Al Quoz, hanging steamed.",
        time: "Yesterday",
      },
      {
        id: "s3",
        from: "buyer",
        text: "Would you take AED 2,100? Escrow and AJEX from Marina.",
        time: "3h",
      },
    ],
  },
  {
    id: "hana-zimmermann",
    listingId: "zimmermann-floral",
    side: "selling",
    viewer: "seller",
    status: "accepted",
    yourTurn: true,
    seller: {
      handle: "@You",
      initials: "YO",
      responseRate: "—",
    },
    buyer: {
      handle: "@Hana_DT",
      initials: "HD",
      responseRate: "89% response · usually 1h",
    },
    offerAmount: 2200,
    lastMessage: "Accepted. Complete escrow as this buyer to close the other offers.",
    lastAt: "1h",
    messages: [
      {
        id: "h1",
        from: "buyer",
        text: "Still hanging? I have a wedding on the Palm in May.",
        time: "Yesterday",
      },
      {
        id: "h2",
        from: "seller",
        text: "It is. One wedding, then the closet. Original lining intact.",
        time: "Yesterday",
      },
      {
        id: "h3",
        from: "buyer",
        text: "I can do AED 2,200 into escrow today. Don’t let it go.",
        time: "1h",
      },
      {
        id: "h4",
        from: "seller",
        text: "Accepted at AED 2,200. Pay into Mamo Pay escrow to lock the floral.",
        time: "50m",
      },
    ],
  },
  {
    id: "rania-zimmermann",
    listingId: "zimmermann-floral",
    side: "selling",
    viewer: "seller",
    status: "pending",
    yourTurn: true,
    seller: {
      handle: "@You",
      initials: "YO",
      responseRate: "—",
    },
    buyer: {
      handle: "@Rania_JBR",
      initials: "RJ",
      responseRate: "92% response · usually 50m",
    },
    offerAmount: 2000,
    lastMessage: "AED 2,000 is my ceiling. Floor-legal. Say the word.",
    lastAt: "40m",
    messages: [
      {
        id: "r1",
        from: "buyer",
        text: "The maxi photographs warmer in person?",
        time: "2h",
      },
      {
        id: "r2",
        from: "seller",
        text: "A little. Al Quoz light is flatter than Palm sun.",
        time: "90m",
      },
      {
        id: "r3",
        from: "buyer",
        text: "AED 2,000 is my ceiling. Floor-legal. Say the word.",
        time: "40m",
      },
    ],
  },
  {
    id: "noor-hana",
    listingId: "downtown-02",
    side: "selling",
    viewer: "seller",
    status: "shipped",
    yourTurn: false,
    seller: {
      handle: "@You",
      initials: "YO",
      responseRate: "—",
    },
    buyer: {
      handle: "@Noor_JLT",
      initials: "NJ",
      responseRate: "88% response · usually 3h",
    },
    offerAmount: 1450,
    lastMessage: "AJEX picked up from Dubai Marina. Out toward Downtown.",
    lastAt: "Tue",
    messages: [
      {
        id: "n1",
        from: "buyer",
        text: "Taking the ivory set at asking. Sending Mamo Pay now.",
        time: "Mon",
      },
      {
        id: "n2",
        from: "seller",
        text: "Accepted. Label is on the bag — driver is booked.",
        time: "Mon",
      },
      {
        id: "n3",
        from: "seller",
        text: "AJEX picked up from Dubai Marina. Out toward Downtown.",
        time: "Tue",
      },
    ],
  },
];

export function statusLabel(thread: ChatThread): string {
  if (thread.status === "sold_out") return "Sold Out";
  if (thread.status === "accepted") return "Offer Accepted (Go to Checkout)";
  if (thread.status === "shipped") return "Shipped (Track with AJEX)";
  return thread.yourTurn ? "Offer Pending (Your Turn)" : "Offer Pending";
}

export function counterpart(thread: ChatThread): ChatPerson {
  return thread.viewer === "buyer" ? thread.seller : thread.buyer;
}

export async function listChats(): Promise<ChatThread[]> {
  return THREADS.map((thread) => ({
    ...thread,
    messages: [...thread.messages],
  }));
}

export function chatsForListing(listingId: string): ChatThread[] {
  return THREADS.filter((thread) => thread.listingId === listingId).map((thread) => ({
    ...thread,
    messages: [...thread.messages],
  }));
}

export async function getChat(id: string): Promise<ChatThread | null> {
  const byChat = THREADS.find((thread) => thread.id === id);
  if (byChat) return { ...byChat, messages: [...byChat.messages] };

  const listing = await getListing(id);
  if (!listing) return null;

  return {
    ...THREADS[0],
    id,
    listingId: listing.id,
    messages: [...THREADS[0].messages],
  };
}

export async function getChatListing(id: string): Promise<Listing | null> {
  const chat = await getChat(id);
  if (!chat) return null;
  return getListing(chat.listingId);
}
