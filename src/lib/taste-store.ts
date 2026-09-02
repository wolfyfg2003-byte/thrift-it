import { useSyncExternalStore } from "react";
import {
  applyTasteWeights,
  buildInitialTaste,
  EMPTY_TASTE,
  isTasteCalibrated,
  type TasteEvent,
  type TastePreferences,
} from "@/lib/taste";

export type TasteState = {
  preferences: TastePreferences;
  swipedIds: string[];
};

const STORAGE_KEY = "thrift-it-taste";
const listeners = new Set<() => void>();

const EMPTY_STATE: TasteState = {
  preferences: { ...EMPTY_TASTE, brands: {}, categories: {} },
  swipedIds: [],
};

const SERVER_STATE: TasteState = {
  preferences: { sizes: [], brands: {}, categories: {} },
  swipedIds: [],
};

let state: TasteState = structuredClone(EMPTY_STATE);
let restored = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  emit();
}

function asTaste(value: unknown): TastePreferences {
  if (!value || typeof value !== "object") {
    return { sizes: [], brands: {}, categories: {} };
  }
  const raw = value as Partial<TastePreferences>;
  return {
    sizes: Array.isArray(raw.sizes)
      ? raw.sizes.filter((item): item is string => typeof item === "string")
      : [],
    brands:
      raw.brands && typeof raw.brands === "object" && !Array.isArray(raw.brands)
        ? Object.fromEntries(
            Object.entries(raw.brands).filter(
              (entry): entry is [string, number] => typeof entry[1] === "number",
            ),
          )
        : {},
    categories:
      raw.categories &&
      typeof raw.categories === "object" &&
      !Array.isArray(raw.categories)
        ? Object.fromEntries(
            Object.entries(raw.categories).filter(
              (entry): entry is [string, number] => typeof entry[1] === "number",
            ),
          )
        : {},
  };
}

export function restoreTaste() {
  if (restored || typeof window === "undefined") return;
  restored = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<TasteState>;
    state = {
      preferences: asTaste(parsed.preferences),
      swipedIds: Array.isArray(parsed.swipedIds)
        ? parsed.swipedIds.filter((id): id is string => typeof id === "string")
        : [],
    };
  } catch {
    state = structuredClone(EMPTY_STATE);
  }
  emit();
}

export function getTaste(): TasteState {
  return state;
}

export function subscribeTaste(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTaste(): TasteState {
  return useSyncExternalStore(subscribeTaste, getTaste, () => SERVER_STATE);
}

export function hasCalibratedTaste(value: TasteState = state): boolean {
  return isTasteCalibrated(value.preferences);
}

export function saveInitialTaste(
  sizes: string[],
  brands: string[],
  aesthetics: string[] = [],
) {
  state = {
    preferences: buildInitialTaste(sizes, brands, aesthetics),
    swipedIds: [],
  };
  persist();
}

export function recordTasteEvent(input: {
  brand: string;
  category: string;
  event: TasteEvent;
  listingId?: string;
}) {
  const swipedIds = [...state.swipedIds];
  if (
    input.listingId &&
    (input.event === "like" || input.event === "pass") &&
    !swipedIds.includes(input.listingId)
  ) {
    swipedIds.push(input.listingId);
  }
  state = {
    preferences: applyTasteWeights(
      state.preferences,
      input.brand,
      input.category,
      input.event,
    ),
    swipedIds,
  };
  persist();
}

export function clearTasteSwipes() {
  state = { ...state, swipedIds: [] };
  persist();
}

export function undoTasteSwipe(listingId: string) {
  if (!listingId || !state.swipedIds.includes(listingId)) return;
  state = {
    ...state,
    swipedIds: state.swipedIds.filter((id) => id !== listingId),
  };
  persist();
}
