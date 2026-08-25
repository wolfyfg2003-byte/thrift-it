import { useSyncExternalStore } from "react";
import {
  defaultDressSizeKey,
  parseSizeKey,
  sizeKeyToDressCode,
} from "@/lib/filters";
import { normalizeAddress, type UaeAddress } from "@/lib/uae-address";
import type { SizeCode } from "@/lib/listings";

export type MamoCard = {
  token: string;
  brand: "Visa" | "Mastercard" | "Apple Pay";
  last4: string;
  expMonth: string;
  expYear: string;
  isDefault: boolean;
};

export type NotificationPrefs = {
  whatsappBargains: boolean;
  inAppMessages: boolean;
  emailTracking: boolean;
};

export type UserProfile = {
  name: string;
  email: string;
  mobile: string;
  dressSizeCode: SizeCode;
  dressSizeKey: string;
  address: UaeAddress;
  cards: MamoCard[];
  notifications: NotificationPrefs;
};

const STORAGE_KEY = "thrift-it-profile";
const listeners = new Set<() => void>();

const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  whatsappBargains: true,
  inAppMessages: true,
  emailTracking: true,
};

const DEFAULT_PROFILE: UserProfile = {
  name: "Jad Zein",
  email: "jad@demo.thriftit.ae",
  mobile: "+971 50 432 1964",
  dressSizeCode: "S",
  dressSizeKey: defaultDressSizeKey("S"),
  address: {
    emirate: "Dubai",
    community: "Dubai Marina",
    dwelling: "apartment",
    building: "Marina Gate",
    unit: "2408",
    street: "Al Thanyah Street",
    instructions: "Drop at front desk security",
  },
  cards: [
    {
      token: "mamo_tok_visa_4321",
      brand: "Visa",
      last4: "4321",
      expMonth: "08",
      expYear: "28",
      isDefault: true,
    },
  ],
  notifications: { ...DEFAULT_NOTIFICATIONS },
};

const SERVER_PROFILE: UserProfile = structuredClone(DEFAULT_PROFILE);

let profile: UserProfile = structuredClone(DEFAULT_PROFILE);
let restored = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    /* private mode */
  }
}

function normalizeNotifications(
  raw: Partial<NotificationPrefs> & {
    offers?: boolean;
    escrow?: boolean;
    promotions?: boolean;
  },
): NotificationPrefs {
  return {
    whatsappBargains:
      typeof raw.whatsappBargains === "boolean"
        ? raw.whatsappBargains
        : typeof raw.offers === "boolean"
          ? raw.offers
          : DEFAULT_NOTIFICATIONS.whatsappBargains,
    inAppMessages:
      typeof raw.inAppMessages === "boolean"
        ? raw.inAppMessages
        : DEFAULT_NOTIFICATIONS.inAppMessages,
    emailTracking:
      typeof raw.emailTracking === "boolean"
        ? raw.emailTracking
        : typeof raw.escrow === "boolean"
          ? raw.escrow
          : DEFAULT_NOTIFICATIONS.emailTracking,
  };
}

function normalizeCard(raw: Partial<MamoCard>): MamoCard | null {
  const brand =
    raw.brand === "Mastercard" || raw.brand === "Apple Pay" || raw.brand === "Visa"
      ? raw.brand
      : null;
  if (!brand || typeof raw.token !== "string") return null;
  const last4 =
    brand === "Visa" && raw.last4 === "4242" && raw.token.includes("4242")
      ? "4321"
      : typeof raw.last4 === "string"
        ? raw.last4
        : "";
  return {
    token:
      brand === "Visa" && raw.token.includes("4242") ? "mamo_tok_visa_4321" : raw.token,
    brand,
    last4,
    expMonth: typeof raw.expMonth === "string" ? raw.expMonth : "",
    expYear: typeof raw.expYear === "string" ? raw.expYear : "",
    isDefault: Boolean(raw.isDefault),
  };
}

function normalize(raw: Partial<UserProfile> | null): UserProfile {
  const next = structuredClone(DEFAULT_PROFILE);
  if (!raw || typeof raw !== "object") return next;
  const cards = Array.isArray(raw.cards)
    ? raw.cards
        .map((card) => normalizeCard(card as Partial<MamoCard>))
        .filter((card): card is MamoCard => Boolean(card))
    : next.cards;
  if (cards.length > 0 && !cards.some((card) => card.isDefault)) {
    cards[0] = { ...cards[0], isDefault: true };
  }
  return {
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name : next.name,
    email: typeof raw.email === "string" && raw.email.trim() ? raw.email : next.email,
    mobile: typeof raw.mobile === "string" && raw.mobile.trim() ? raw.mobile : next.mobile,
    dressSizeCode: (() => {
      const key =
        typeof raw.dressSizeKey === "string" && parseSizeKey(raw.dressSizeKey)
          ? raw.dressSizeKey
          : null;
      const fromKey = key ? sizeKeyToDressCode(key) : null;
      if (fromKey) return fromKey;
      return raw.dressSizeCode === "S" || raw.dressSizeCode === "M" || raw.dressSizeCode === "L"
        ? raw.dressSizeCode
        : next.dressSizeCode;
    })(),
    dressSizeKey:
      typeof raw.dressSizeKey === "string" && parseSizeKey(raw.dressSizeKey)
        ? raw.dressSizeKey
        : defaultDressSizeKey(
            raw.dressSizeCode === "S" || raw.dressSizeCode === "M" || raw.dressSizeCode === "L"
              ? raw.dressSizeCode
              : next.dressSizeCode,
          ),
    address: normalizeAddress(raw.address, next.address),
    cards: cards.length > 0 ? cards : next.cards,
    notifications: normalizeNotifications(raw.notifications ?? {}),
  };
}

export function restoreProfile() {
  if (restored || typeof window === "undefined") return;
  restored = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) profile = normalize(JSON.parse(raw) as Partial<UserProfile>);
  } catch {
    profile = structuredClone(DEFAULT_PROFILE);
  }
  emit();
}

export function getProfile(): UserProfile {
  return profile;
}

export function subscribeProfile(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function saveProfile(patch: Partial<UserProfile>) {
  profile = normalize({
    ...profile,
    ...patch,
    address: patch.address ?? profile.address,
    notifications: patch.notifications ?? profile.notifications,
    cards: patch.cards ?? profile.cards,
  });
  persist();
  emit();
}

export function saveAddress(address: UaeAddress) {
  profile = { ...profile, address: normalizeAddress(address, profile.address) };
  persist();
  emit();
}

export function saveNotifications(notifications: NotificationPrefs) {
  profile = { ...profile, notifications: normalizeNotifications(notifications) };
  persist();
  emit();
}

export function setDefaultCard(token: string) {
  profile = {
    ...profile,
    cards: profile.cards.map((card) => ({
      ...card,
      isDefault: card.token === token,
    })),
  };
  persist();
  emit();
}

export function addMamoCard(input: {
  brand: MamoCard["brand"];
  last4: string;
  expMonth: string;
  expYear: string;
}) {
  const token = `mamo_tok_${input.brand.toLowerCase().replace(/\s+/g, "_")}_${input.last4 || "wallet"}_${Date.now().toString(36)}`;
  const card: MamoCard = {
    token,
    brand: input.brand,
    last4: input.last4,
    expMonth: input.expMonth,
    expYear: input.expYear,
    isDefault: profile.cards.length === 0,
  };
  profile = {
    ...profile,
    cards: [...profile.cards, card],
  };
  persist();
  emit();
  return card;
}

export function addApplePay() {
  if (profile.cards.some((card) => card.brand === "Apple Pay")) return;
  addMamoCard({
    brand: "Apple Pay",
    last4: "",
    expMonth: "",
    expYear: "",
  });
}

export function removeMamoCard(token: string) {
  const remaining = profile.cards.filter((card) => card.token !== token);
  if (remaining.length > 0 && !remaining.some((card) => card.isDefault)) {
    remaining[0] = { ...remaining[0], isDefault: true };
  }
  profile = { ...profile, cards: remaining };
  persist();
  emit();
}

export function useProfile(): UserProfile {
  return useSyncExternalStore(subscribeProfile, getProfile, () => SERVER_PROFILE);
}

export function defaultCard(profileValue: UserProfile): MamoCard | null {
  return (
    profileValue.cards.find((card) => card.isDefault) ??
    profileValue.cards[0] ??
    null
  );
}

export function localMobileDigits(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  return digits.startsWith("971") ? digits.slice(3) : digits;
}

export function formatUaeMobile(local: string): string {
  const digits = local.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 2) return digits ? `+971 ${digits}` : "+971";
  if (digits.length <= 5) return `+971 ${digits.slice(0, 2)} ${digits.slice(2)}`;
  return `+971 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
}

export function isVerifiedMobile(mobile: string): boolean {
  const digits = localMobileDigits(mobile);
  return digits.length >= 8 && digits.length <= 9;
}
