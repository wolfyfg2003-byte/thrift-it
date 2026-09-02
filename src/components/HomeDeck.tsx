"use client";

import { FilterDrawer, type GeoStatus } from "@/components/FilterDrawer";
import { LiveDropBanner } from "@/components/LiveDropBanner";
import SwipeDeck from "@/components/SwipeDeck";
import { isDropLocked, remainingDropMs } from "@/lib/drop";
import { rankDeck } from "@/lib/deck-rank";
import {
  DECK_CIRCLES,
  EMPTY_FILTERS,
  filterListings,
  filtersAreActive,
  formatSizeKeyLabel,
  type DeckCircle,
  type DeckFilters,
} from "@/lib/filters";
import { useFollowState } from "@/lib/follow-store";
import {
  coordsForPlace,
  requestBrowserPosition,
  type GeoPoint,
} from "@/lib/geo";
import { stampDropSchedule, type Listing } from "@/lib/listings";
import { usePlusState } from "@/lib/plus-store";
import { restoreProfile, useProfile } from "@/lib/profile-store";
import {
  hasCalibratedTaste,
  restoreTaste,
  useTaste,
} from "@/lib/taste-store";
import { rankListingsByTaste } from "@/lib/taste";
import { useEffect, useMemo, useState } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function HomeDeck({
  listings,
  preserveServerOrder = false,
}: {
  listings: Listing[];
  preserveServerOrder?: boolean;
}) {
  const [filters, setFilters] = useState<DeckFilters>(EMPTY_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [circle, setCircle] = useState<DeckCircle>("for-you");
  const [mySizeOnly, setMySizeOnly] = useState(false);
  const [origin, setOrigin] = useState<GeoPoint | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [dropOrigin, setDropOrigin] = useState<number | null>(null);
  const [watchedIds, setWatchedIds] = useState<string[]>([]);
  const [hiddenWatchIds, setHiddenWatchIds] = useState<string[]>([]);
  const [liveBanner, setLiveBanner] = useState<Listing | null>(null);
  const [injectId, setInjectId] = useState<string | null>(null);
  const [watchToast, setWatchToast] = useState(false);
  const plus = usePlusState();
  const follow = useFollowState();
  const profile = useProfile();
  const taste = useTaste();

  useEffect(() => {
    restoreProfile();
    restoreTaste();
  }, []);

  useEffect(() => {
    setDropOrigin(Date.now());
  }, []);

  const catalog = useMemo(
    () =>
      dropOrigin == null
        ? listings.map((item) => ({
            ...item,
            isWatched: watchedIds.includes(item.id),
          }))
        : stampDropSchedule(listings, dropOrigin, watchedIds),
    [listings, dropOrigin, watchedIds],
  );

  const scheduledDrops = useMemo(
    () => catalog.filter((item) => Boolean(item.dropTime)),
    [catalog],
  );

  const flashWatchToast = () => {
    setWatchToast(true);
    window.setTimeout(() => setWatchToast(false), 2600);
  };

  const watchDrop = (id: string) => {
    setWatchedIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
    setHiddenWatchIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
    flashWatchToast();
  };

  const unwatchDrop = (id: string) => {
    setWatchedIds((ids) => ids.filter((item) => item !== id));
    setHiddenWatchIds((ids) => ids.filter((item) => item !== id));
    setLiveBanner((current) => (current?.id === id ? null : current));
  };

  const toggleWatch = (id: string) => {
    if (watchedIds.includes(id)) unwatchDrop(id);
    else watchDrop(id);
  };

  useEffect(() => {
    if (geoStatus === "ready") return;
    const fromAddress = coordsForPlace(profile.address.community);
    if (!fromAddress) return;
    setOrigin((current) => current ?? fromAddress);
  }, [profile.address.community, geoStatus]);

  useEffect(() => {
    if (filters.radiusKm == null) return;
    let cancelled = false;
    setGeoStatus("locating");
    setGeoMessage(null);
    requestBrowserPosition()
      .then((point) => {
        if (cancelled) return;
        setOrigin(point);
        setGeoStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const denied =
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          (error as { code: number }).code === 1;
        const fallback = coordsForPlace(profile.address.community);
        if (denied) {
          setGeoStatus("denied");
          setGeoMessage(null);
          if (fallback) setOrigin(fallback);
          return;
        }
        if (fallback) {
          setOrigin(fallback);
          setGeoStatus("fallback");
          setGeoMessage(
            `Using your saved address in ${profile.address.community}.`,
          );
          return;
        }
        setGeoStatus("denied");
      });
    return () => {
      cancelled = true;
    };
  }, [filters.radiusKm, profile.address.community]);

  const filtered = useMemo(() => {
    const cut = filterListings(catalog, filters, {
      circle,
      following: follow.usernames,
      origin,
    });
    const ranked = hasCalibratedTaste(taste)
      ? rankListingsByTaste(
          cut,
          taste.preferences,
          new Set(taste.swipedIds),
        )
      : preserveServerOrder
        ? cut
        : rankDeck(cut, {
            dressSize: profile.dressSizeCode,
            dressSizeKey: profile.dressSizeKey,
            community: profile.address.community,
            origin,
            mySizeOnly,
          });
    const upcoming = ranked
      .filter((item) => isDropLocked(item))
      .sort((a, b) => remainingDropMs(a) - remainingDropMs(b));
    const rest = ranked.filter((item) => !isDropLocked(item));
    const ordered = [...upcoming, ...rest];
    const hidden = new Set(hiddenWatchIds);
    let rail = ordered.filter((item) => !hidden.has(item.id));
    if (injectId) {
      const card = catalog.find((item) => item.id === injectId);
      if (card) {
        rail = [card, ...rail.filter((item) => item.id !== injectId)];
      }
    }
    return rail;
  }, [
    catalog,
    filters,
    plus.boosts,
    circle,
    follow.usernames,
    profile.dressSizeCode,
    profile.dressSizeKey,
    profile.address.community,
    mySizeOnly,
    origin,
    hiddenWatchIds,
    preserveServerOrder,
    injectId,
    taste,
  ]);

  useEffect(() => {
    if (watchedIds.length === 0) return;
    const tick = () => {
      for (const id of watchedIds) {
        const item = catalog.find((listing) => listing.id === id);
        if (item?.dropTime && !isDropLocked(item.dropTime)) {
          setLiveBanner((current) => current ?? item);
          return;
        }
      }
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [watchedIds, catalog]);
  const active = filtersAreActive(filters);
  const followingEmpty = circle === "following" && filtered.length === 0;
  const sizeEmpty = mySizeOnly && filtered.length === 0 && !followingEmpty;
  const tasteEmpty =
    hasCalibratedTaste(taste) &&
    filtered.length === 0 &&
    !followingEmpty &&
    !sizeEmpty;
  const radiusEmpty =
    filters.radiusKm != null &&
    filtered.length === 0 &&
    !followingEmpty &&
    !sizeEmpty &&
    !tasteEmpty;

  const clear = () => {
    setFilters(EMPTY_FILTERS);
    setDrawerOpen(false);
    setCircle("for-you");
    setMySizeOnly(false);
  };

  const openLiveDrop = () => {
    if (!liveBanner) return;
    const id = liveBanner.id;
    setHiddenWatchIds((ids) => ids.filter((item) => item !== id));
    setInjectId(id);
    setLiveBanner(null);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {liveBanner ? (
        <LiveDropBanner
          title={liveBanner.title}
          onOpen={openLiveDrop}
          onDismiss={() => setLiveBanner(null)}
        />
      ) : null}
      {watchToast ? (
        <p
          role="status"
          className="pointer-events-none fixed top-[max(4.75rem,calc(env(safe-area-inset-top)+3.6rem))] left-1/2 z-50 w-[min(calc(100%-2.5rem),24rem)] -translate-x-1/2 rounded-full bg-[oklch(0.28_0.04_55)] px-4 py-2.5 text-center text-[12px] leading-4 text-[oklch(0.96_0.02_85)] motion-safe:animate-[drop-toast_2.4s_cubic-bezier(0.16,1,0.3,1)_both]"
        >
          Watching this drop! We will alert you the second it goes live.
        </p>
      ) : null}
      <div className="flex items-center gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search the closet</span>
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[oklch(0.45_0.03_55)]">
            <SearchIcon />
          </span>
          <input
            value={filters.query}
            onChange={(event) =>
              setFilters((current) => ({ ...current, query: event.target.value }))
            }
            placeholder="Search brands or pieces"
            autoComplete="off"
            enterKeyHint="search"
            className="h-12 w-full rounded-full border border-[oklch(0.88_0.018_80)] bg-[#F9F6F0] pr-4 pl-11 text-[16px] text-[oklch(0.22_0.025_55)] outline-none placeholder:text-[oklch(0.5_0.025_55)] focus:border-[oklch(0.48_0.12_52)]"
          />
        </label>
        <button
          type="button"
          aria-label="Filters"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen((open) => !open)}
          className={`grid size-12 shrink-0 place-items-center rounded-full border text-[oklch(0.22_0.025_55)] transition-colors duration-200 ${
            drawerOpen || active
              ? "border-[oklch(0.78_0.03_72)] bg-[oklch(0.96_0.01_82)]"
              : "border-[oklch(0.88_0.018_80)] bg-[#F9F6F0] hover:bg-[oklch(0.96_0.012_82)]"
          }`}
          style={{ transitionTimingFunction: EASE }}
        >
          <SlidersIcon />
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Curated circles"
        className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {DECK_CIRCLES.map((item) => {
          const selected = circle === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setCircle(item.id)}
              className={`h-9 shrink-0 rounded-full px-3.5 text-[14px] transition-colors duration-200 ${
                selected
                  ? "bg-[oklch(0.22_0.025_55)] font-semibold text-[oklch(0.98_0.012_85)]"
                  : "border border-[oklch(0.86_0.02_80)] font-medium text-[oklch(0.38_0.03_55)] hover:bg-[oklch(0.96_0.012_82)]"
              }`}
              style={{ transitionTimingFunction: EASE }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 py-1">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
            My Size Only
          </p>
          <p className="text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
            {formatSizeKeyLabel(profile.dressSizeKey)} from your profile
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={mySizeOnly}
          aria-label="My Size Only"
          onClick={() => setMySizeOnly((on) => !on)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
            mySizeOnly ? "bg-[oklch(0.48_0.12_52)]" : "bg-[oklch(0.88_0.018_80)]"
          }`}
          style={{ transitionTimingFunction: EASE }}
        >
          <span
            className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-[oklch(0.98_0.012_85)] shadow-[0_4px_10px_-4px_oklch(0.22_0.03_55/0.45)] transition-transform duration-200 ${
              mySizeOnly ? "translate-x-5" : "translate-x-0"
            }`}
            style={{ transitionTimingFunction: EASE }}
          />
        </button>
      </div>

      <FilterDrawer
        open={drawerOpen}
        filters={filters}
        geoStatus={geoStatus}
        geoMessage={geoMessage}
        onChange={setFilters}
        upcomingDrops={scheduledDrops}
        onToggleWatch={toggleWatch}
        onClose={() => setDrawerOpen(false)}
      />

      {active ? (
        <div className="mt-3 flex items-center justify-between gap-8">
          <span className="rounded-full bg-[oklch(0.93_0.018_72)] px-3 py-1.5 text-[12px] leading-4 text-[oklch(0.32_0.04_52)]">
            Filters Active
          </span>
          <button
            type="button"
            onClick={clear}
            className="rounded-full px-3 py-1.5 text-[14px] font-semibold text-[oklch(0.22_0.025_55)]"
          >
            Clear
          </button>
        </div>
      ) : null}

      <SwipeDeck
        listings={filtered}
        buyerOrigin={origin}
        forceFrontId={injectId}
        onWatchHide={watchDrop}
        filtersActive={active || circle !== "for-you" || mySizeOnly}
        onClearFilters={clear}
        emptyTitle={
          followingEmpty
            ? follow.usernames.length === 0
              ? "Follow a closet first"
              : "Nothing from your circle"
            : sizeEmpty
              ? "Nothing in your size"
              : tasteEmpty
                ? "Your closet is calibrated"
                : radiusEmpty
                  ? "Nothing in this radius"
                  : undefined
        }
        emptyBody={
          followingEmpty
            ? follow.usernames.length === 0
              ? "Open a seller profile and tap Follow Closet. Their pieces land here."
              : "Sellers you follow have nothing on the rail right now."
            : sizeEmpty
              ? "Turn off My Size Only to see the rest of the rail, or edit dress size in Account Settings."
              : tasteEmpty
                ? "Every piece in your sizes has been swiped. Replay the rail to train it again."
                : radiusEmpty
                  ? "Widen Distance Radius, or choose All UAE to see the rest of the rail."
                  : undefined
        }
      />
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12.2 12.2 15.5 15.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 5.5h12M3 12.5h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="7" cy="5.5" r="1.7" fill="#F9F6F0" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="11" cy="12.5" r="1.7" fill="#F9F6F0" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

