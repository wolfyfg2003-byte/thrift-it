import { useCallback, useSyncExternalStore } from "react";

export const FREE_BACKTRACKS = 3;
export const PLUS_MONTHLY_AED = 19;
export const BOOST_AED = 15;
export const BOOST_HOURS = 24;

export type PlusReason = "plus" | "rewind";

export type PlusState = {
  freeBacktracksLeft: number;
  plusActive: boolean;
  paywallOpen: boolean;
  paywallReason: PlusReason;
  boosts: Record<string, number>;
  boostListingId: string | null;
};

const STORAGE_KEY = "thrift-it-plus";
const listeners = new Set<() => void>();

let state: PlusState = {
  freeBacktracksLeft: FREE_BACKTRACKS,
  plusActive: false,
  paywallOpen: false,
  paywallReason: "plus",
  boosts: {},
  boostListingId: null,
};
const SERVER_PLUS: PlusState = {
  freeBacktracksLeft: FREE_BACKTRACKS,
  plusActive: false,
  paywallOpen: false,
  paywallReason: "plus",
  boosts: {},
  boostListingId: null,
};
let restored = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        plusActive: state.plusActive,
        freeBacktracksLeft: state.freeBacktracksLeft,
      }),
    );
  } catch {
    /* private mode */
  }
}

function setState(patch: Partial<PlusState>) {
  state = { ...state, ...patch };
  persist();
  emit();
}

export function restorePlus() {
  if (restored || typeof window === "undefined") return;
  restored = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as {
      plusActive?: boolean;
      freeBacktracksLeft?: number;
    };
    state = {
      ...state,
      plusActive: Boolean(parsed.plusActive),
      freeBacktracksLeft:
        typeof parsed.freeBacktracksLeft === "number"
          ? parsed.freeBacktracksLeft
          : state.freeBacktracksLeft,
    };
    emit();
  } catch {
    /* ignore */
  }
}

export function getPlusState(): PlusState {
  return state;
}

export function subscribePlus(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function openPlusPaywall(reason: PlusReason = "plus") {
  setState({
    paywallOpen: true,
    paywallReason: reason === "rewind" ? "rewind" : "plus",
  });
}

export function closePlusPaywall() {
  setState({ paywallOpen: false });
}

export function activatePlus() {
  setState({ plusActive: true });
}

/** Spend a free backtrack, or open the Plus paywall when none remain. */
export function consumeBacktrack(): "ok" | "paywall" {
  if (state.plusActive) return "ok";
  if (state.freeBacktracksLeft > 0) {
    setState({ freeBacktracksLeft: state.freeBacktracksLeft - 1 });
    return "ok";
  }
  setState({ paywallOpen: true, paywallReason: "rewind" });
  return "paywall";
}

export function openBoostCheckout(listingId: string) {
  setState({ boostListingId: listingId });
}

export function closeBoostCheckout() {
  setState({ boostListingId: null });
}

export function confirmBoost(listingId: string) {
  const until = Date.now() + BOOST_HOURS * 60 * 60 * 1000;
  setState({
    boosts: { ...state.boosts, [listingId]: until },
  });
}

export function boostExpiresAt(listingId: string, now = Date.now()): number | null {
  const until = state.boosts[listingId];
  if (!until || until <= now) return null;
  return until;
}

export function isBoosted(listingId: string, now = Date.now()): boolean {
  return boostExpiresAt(listingId, now) !== null;
}

export function sortByBoost<T extends { id: string }>(items: T[], now = Date.now()): T[] {
  return [...items].sort((a, b) => {
    const aUntil = state.boosts[a.id] && state.boosts[a.id] > now ? state.boosts[a.id] : 0;
    const bUntil = state.boosts[b.id] && state.boosts[b.id] > now ? state.boosts[b.id] : 0;
    return bUntil - aUntil;
  });
}

export function usePlusState(): PlusState {
  return useSyncExternalStore(subscribePlus, getPlusState, () => SERVER_PLUS);
}

export function usePlus() {
  const snapshot = usePlusState();
  return {
    ...snapshot,
    openPaywall: useCallback(openPlusPaywall, []),
    closePaywall: useCallback(closePlusPaywall, []),
    activatePlus: useCallback(activatePlus, []),
    consumeBacktrack: useCallback(consumeBacktrack, []),
    openBoostCheckout: useCallback(openBoostCheckout, []),
    closeBoostCheckout: useCallback(closeBoostCheckout, []),
    confirmBoost: useCallback(confirmBoost, []),
  };
}
