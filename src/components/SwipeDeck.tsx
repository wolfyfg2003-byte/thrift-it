"use client";

import { DropLock } from "@/components/DropLock";
import OfferModal from "@/components/OfferModal";
import { formatAed } from "@/lib/checkout";
import { isDropLocked } from "@/lib/drop";
import { listingProximityLabel, type GeoPoint } from "@/lib/geo";
import type { Listing } from "@/lib/listings";
import { consumeBacktrack, isBoosted, openPlusPaywall, usePlusState } from "@/lib/plus-store";
import { findSeller, sellerPath } from "@/lib/sellers";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const THRESHOLD = 96;
const EXIT_MS = 280;

export default function SwipeDeck({
  listings,
  buyerOrigin = null,
  filtersActive = false,
  onClearFilters,
  emptyTitle,
  emptyBody,
  forceFrontId = null,
  onWatchHide,
}: {
  listings: Listing[];
  buyerOrigin?: GeoPoint | null;
  filtersActive?: boolean;
  onClearFilters?: () => void;
  emptyTitle?: string;
  emptyBody?: string;
  forceFrontId?: string | null;
  onWatchHide?: (id: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exit, setExit] = useState<"left" | "right" | null>(null);
  const [offerFor, setOfferFor] = useState<Listing | null>(null);
  const [detailsFor, setDetailsFor] = useState<Listing | null>(null);
  const [passedIds, setPassedIds] = useState<string[]>([]);
  const [replayKey, setReplayKey] = useState(0);
  const plus = usePlusState();
  const startX = useRef(0);
  const pointer = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [now, setNow] = useState(() => Date.now());
  const [insertPulse, setInsertPulse] = useState(false);
  const forcedIdRef = useRef<string | null>(null);
  const current = listings[index] ?? null;
  const next = listings[index + 1] ?? null;
  const empty = index >= listings.length;
  const currentLocked = current ? isDropLocked(current, now) : false;
  const nextLocked = next ? isDropLocked(next, now) : false;
  const listingIds = listings.map((item) => item.id).join("|");
  const cursorIdRef = useRef<string | null>(null);
  const prevIdsRef = useRef("");

  if (current) cursorIdRef.current = current.id;

  useEffect(() => {
    if (prevIdsRef.current === listingIds) return;
    const previous = prevIdsRef.current ? prevIdsRef.current.split("|") : [];
    prevIdsRef.current = listingIds;
    const nextIds = listingIds ? listingIds.split("|") : [];

    setDx(0);
    setExit(null);
    setDragging(false);

    const keepId = cursorIdRef.current;
    if (!keepId || nextIds.length === 0) {
      setIndex(0);
      return;
    }

    const stillHere = nextIds.indexOf(keepId);
    if (stillHere >= 0) {
      setIndex(stillHere);
      return;
    }

    const oldIndex = previous.indexOf(keepId);
    const later = oldIndex >= 0 ? previous.slice(oldIndex + 1) : [];
    const fallback = later.find((id) => nextIds.includes(id));
    setIndex(fallback ? nextIds.indexOf(fallback) : nextIds.length);
  }, [listingIds]);

  useEffect(() => {
    if (!forceFrontId || forcedIdRef.current === forceFrontId) return;
    const at = listings.findIndex((item) => item.id === forceFrontId);
    if (at < 0) return;
    forcedIdRef.current = forceFrontId;
    setIndex(at);
    setDx(0);
    setExit(null);
    setDragging(false);
    setInsertPulse(true);
    const timer = window.setTimeout(() => setInsertPulse(false), 480);
    return () => window.clearTimeout(timer);
  }, [forceFrontId, listingIds, listings]);

  useEffect(() => {
    if (!listings.some((item) => item.dropTime)) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [listingIds, listings]);

  const replayDeck = () => {
    setIndex(0);
    setPassedIds([]);
    setDx(0);
    setExit(null);
    setDragging(false);
    setReplayKey((value) => value + 1);
  };

  const fly = useCallback(
    (direction: "left" | "right", openOffer: boolean) => {
      if (!current || exit || isDropLocked(current)) return;
      setExit(direction);
      setDx(direction === "right" ? window.innerWidth : -window.innerWidth);
      window.setTimeout(() => {
        const item = current;
        if (direction === "left") {
          setPassedIds((stack) => [...stack, item.id]);
        }
        setIndex((value) => value + 1);
        setDx(0);
        setExit(null);
        setDragging(false);
        if (openOffer) setOfferFor(item);
      }, EXIT_MS);
    },
    [current, exit],
  );

  const hideWatched = () => {
    if (!current || exit) return;
    setExit("left");
    setDx(-window.innerWidth);
    window.setTimeout(() => {
      const id = current.id;
      setDx(0);
      setExit(null);
      setDragging(false);
      onWatchHide?.(id);
    }, EXIT_MS);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (exit || !current || currentLocked) return;
    pointer.current = event.pointerId;
    startX.current = event.clientX;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== event.pointerId || exit) return;
    setDx(event.clientX - startX.current);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== event.pointerId) return;
    pointer.current = null;
    setDragging(false);
    if (dx > THRESHOLD) fly("right", true);
    else if (dx < -THRESHOLD) fly("left", false);
    else setDx(0);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
  };

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    const prevent = (event: TouchEvent) => {
      if (dragging) event.preventDefault();
    };
    node.addEventListener("touchmove", prevent, { passive: false });
    return () => node.removeEventListener("touchmove", prevent);
  }, [dragging]);

  const backtrack = () => {
    if (exit) return;
    if (passedIds.length === 0) return;
    if (consumeBacktrack() === "paywall") return;
    const id = passedIds[passedIds.length - 1];
    const restore = listings.findIndex((item) => item.id === id);
    setPassedIds((stack) => stack.slice(0, -1));
    if (restore >= 0) {
      setIndex(restore);
      setDx(0);
      setExit(null);
    }
  };

  const needsPlus = passedIds.length > 0 && !plus.plusActive && plus.freeBacktracksLeft <= 0;
  const canRewind = passedIds.length > 0 && (plus.plusActive || plus.freeBacktracksLeft > 0);
  const backtrackEnabled = canRewind || needsPlus;
  const intent = Math.max(-1, Math.min(1, dx / 140));
  const rotating = dragging || Boolean(exit);
  const freezeSwipe = currentLocked && !exit;

  if (empty) {
    if (listings.length === 0) {
      return (
        <div className="flex flex-1 flex-col justify-center px-1 py-8">
          <h2 className="text-[20px] leading-7 font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
            {emptyTitle ?? (filtersActive ? "Nothing in this cut" : "The rail is empty")}
          </h2>
          <p className="mt-3 max-w-[38ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
            {emptyBody ??
              (filtersActive
                ? "Clear filters to return to the mystery deck."
                : "Check back soon for fresh Dubai closets.")}
          </p>
          {filtersActive && onClearFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-8 flex h-12 items-center justify-center rounded-full bg-[oklch(0.48_0.12_52)] text-[14px] font-semibold text-[oklch(0.98_0.012_85)]"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      );
    }

    return <DetoxCompleted onReplay={replayDeck} plusActive={plus.plusActive} />;
  }

  return (
    <>
      <div className="flex flex-1 flex-col justify-center">
      <div className="relative mx-auto w-full max-w-[22.5rem]">
        <div className="relative aspect-[3/4]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[1.5rem] shadow-[0_22px_40px_-24px_oklch(0.22_0.03_55/0.45)]"
          />
          {next ? (
            <article
              aria-hidden="true"
              className="absolute inset-0 overflow-hidden rounded-[1.5rem] bg-[oklch(0.93_0.02_75)]"
            >
              <Cover listing={next} origin={buyerOrigin} />
              {nextLocked && next.dropTime ? (
                <DropLock dropTime={next.dropTime} interactive={false} />
              ) : null}
            </article>
          ) : null}

          {current ? (
            <article
              key={`${current.id}-${replayKey}`}
              ref={cardRef}
              className={`absolute inset-0 overflow-hidden rounded-[1.5rem] bg-[oklch(0.93_0.02_75)] ${
                freezeSwipe ? "" : "touch-none"
              } ${insertPulse && forceFrontId === current.id ? "motion-safe:animate-[drop-insert_420ms_cubic-bezier(0.16,1,0.3,1)_both]" : ""}`}
              style={{
                transform: freezeSwipe
                  ? undefined
                  : `translateX(${dx}px) rotate(${dx / 22}deg)`,
                transition: rotating && !dragging ? `transform ${EXIT_MS}ms ${EASE}` : "none",
              }}
              onPointerDown={freezeSwipe ? undefined : onPointerDown}
              onPointerMove={freezeSwipe ? undefined : onPointerMove}
              onPointerUp={freezeSwipe ? undefined : onPointerUp}
              onPointerCancel={freezeSwipe ? undefined : onPointerUp}
            >
              <Cover listing={current} origin={buyerOrigin} />
              {currentLocked && current.dropTime ? (
                <DropLock
                  dropTime={current.dropTime}
                  interactive
                  onNotify={hideWatched}
                />
              ) : (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      intent > 0
                        ? `oklch(0.52 0.08 145 / ${Math.abs(intent) * 0.28})`
                        : intent < 0
                          ? `oklch(0.62 0.1 72 / ${Math.abs(intent) * 0.28})`
                          : "transparent",
                  }}
                />
              )}
            </article>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-4 lg:mt-4">
        <RoundButton
          label={
            plus.plusActive
              ? "Backtrack"
              : plus.freeBacktracksLeft <= 0
                ? "Backtrack — unlock Plus"
                : `Backtrack, ${plus.freeBacktracksLeft} left`
          }
          onClick={backtrack}
          disabled={!backtrackEnabled}
          badge={plus.plusActive ? null : plus.freeBacktracksLeft}
        >
          <BacktrackIcon />
        </RoundButton>
        <RoundButton
          label="Pass"
          onClick={() => {
            if (currentLocked && current) {
              setPassedIds((stack) => [...stack, current.id]);
              setIndex((value) => value + 1);
              return;
            }
            fly("left", false);
          }}
        >
          <PassIcon />
        </RoundButton>
        <RoundButton label="Details" onClick={() => current && setDetailsFor(current)}>
          <InfoIcon />
        </RoundButton>
        <RoundButton
          label="Make an offer"
          onClick={() => current && setOfferFor(current)}
          disabled={currentLocked}
        >
          <HeartIcon />
        </RoundButton>
      </div>
      </div>

      {offerFor ? (
        <OfferModal
          open
          listing={offerFor}
          onClose={() => setOfferFor(null)}
        />
      ) : null}

      {detailsFor ? (
        <DetailsSheet listing={detailsFor} onClose={() => setDetailsFor(null)} />
      ) : null}
    </>
  );
}

function DetoxCompleted({
  onReplay,
  plusActive,
}: {
  onReplay: () => void;
  plusActive: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-3 py-10 text-center motion-safe:animate-[detox-in_520ms_cubic-bezier(0.16,1,0.3,1)_both]">
      <span
        aria-hidden="true"
        className="grid size-16 place-items-center rounded-full bg-[oklch(0.945_0.025_70)] text-[oklch(0.42_0.1_52)]"
      >
        <HangerMark />
      </span>
      <h2 className="mt-7 font-[family-name:var(--font-bodoni)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.22_0.025_55)]">
        Detox Completed
      </h2>
      <p className="mt-4 max-w-[36ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
        You have detoxed the catalog! Check back soon for fresh closets.
      </p>
      {!plusActive ? (
        <div className="mt-8 w-full max-w-[18.5rem] rounded-[1.35rem] bg-[oklch(0.96_0.018_78)] px-4 py-5 text-left">
          <p className="font-[family-name:var(--font-bodoni)] text-[20px] leading-7 tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
            Thrift It Plus
          </p>
          <p className="mt-2 max-w-[34ch] text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
            Unlimited backtracks so the next closet doesn’t cost you a pass.
          </p>
          <button
            type="button"
            onClick={openPlusPaywall}
            className="mt-4 flex h-11 w-full items-center justify-center rounded-full bg-[oklch(0.48_0.12_52)] text-[14px] font-semibold text-[oklch(0.98_0.012_85)]"
            style={{ transitionTimingFunction: EASE }}
          >
            Unlock Plus
          </button>
        </div>
      ) : null}
      <div className="mt-5 flex w-full max-w-[18.5rem] flex-col gap-3">
        <button
          type="button"
          onClick={onReplay}
          className="flex h-12 items-center justify-center rounded-full border border-[oklch(0.78_0.04_72)] bg-[#FDFBF7] text-[14px] font-semibold text-[oklch(0.22_0.025_55)] transition-colors duration-200 hover:bg-[oklch(0.96_0.012_82)]"
          style={{ transitionTimingFunction: EASE }}
        >
          Replay Deck
        </button>
        <Link
          href="/sell"
          className="flex h-12 items-center justify-center rounded-full border border-[oklch(0.84_0.02_75)] text-[14px] font-semibold text-[oklch(0.22_0.025_55)] transition-colors duration-200 hover:bg-[oklch(0.96_0.012_82)]"
          style={{ transitionTimingFunction: EASE }}
        >
          Clean Out Your Closet
        </Link>
      </div>
    </div>
  );
}

function HangerMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path
        d="M14 5.2c1.5 0 2.4 1.05 2.4 2.25 0 1.1-.7 1.9-1.85 2.2v1.15l8.7 6.05c.7.48.48 1.55-.4 1.55H4.15c-.88 0-1.1-1.07-.4-1.55l8.7-6.05V9.65c-1.15-.3-1.85-1.1-1.85-2.2C10.6 6.25 11.5 5.2 14 5.2Z"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M6 11s3.6-3.05 3.6-5.7A3.6 3.6 0 1 0 2.4 5.3C2.4 7.95 6 11 6 11Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="5.15" r="1.15" fill="currentColor" />
    </svg>
  );
}

function Cover({
  listing,
  origin,
}: {
  listing: Listing;
  origin: GeoPoint | null;
}) {
  const seller = findSeller(listing.sellerUsername);
  const place = listingProximityLabel(
    listing.location,
    { lat: listing.lat, lng: listing.lng },
    origin,
  );
  return (
    <>
      {listing.original_photo_url ? (
        <img
          src={listing.original_photo_url}
          alt=""
          draggable={false}
          className="size-full object-cover"
        />
      ) : (
        <div className="grid size-full place-items-center bg-[oklch(0.9_0.03_62)] font-[family-name:var(--font-bodoni)] text-[48px] text-[oklch(0.38_0.05_52)]">
          {listing.brand.slice(0, 1)}
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] bg-[linear-gradient(to_top,oklch(0.2_0.03_55/0.88),oklch(0.2_0.03_55/0))]" />
      <p className="absolute top-4 left-4 inline-flex max-w-[min(100%-2rem,20rem)] items-center gap-1.5 rounded-full border border-[oklch(0.88_0.02_80/0.55)] bg-[oklch(0.97_0.012_82/0.94)] px-3 py-1.5 text-[12px] leading-4 font-semibold tracking-[0.01em] text-[oklch(0.22_0.025_55)]">
        <PinIcon />
        <span className="truncate" suppressHydrationWarning>
          {place}
        </span>
      </p>
      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="mb-3 inline-flex items-baseline gap-2 rounded-full bg-[oklch(0.48_0.12_52/0.92)] px-3 py-1.5">
          <span className="text-[14px] font-semibold tabular-nums text-[oklch(0.98_0.012_85)]">
            {formatAed(listing.price)}
          </span>
          {listing.original_retail_price ? (
            <span className="text-[12px] tabular-nums text-[oklch(0.92_0.03_80)] line-through">
              {formatAed(listing.original_retail_price)}
            </span>
          ) : null}
        </div>
        <h2 className="font-[family-name:var(--font-bodoni)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.98_0.012_85)]">
          {listing.brand}
        </h2>
        <p className="mt-2 text-[16px] leading-6 text-[oklch(0.95_0.02_85)]">
          {listing.title}
        </p>
        <p className="mt-1 text-[12px] leading-4 text-[oklch(0.9_0.03_80)]">
          {listing.size}
        </p>
        {seller ? (
          <Link
            href={sellerPath(listing.sellerUsername)}
            onPointerDown={(event) => event.stopPropagation()}
            className="relative z-10 mt-2 inline-block text-[12px] leading-4 text-[oklch(0.92_0.03_80)] underline decoration-[oklch(0.78_0.04_80)] underline-offset-2"
          >
            {seller.handle}
          </Link>
        ) : null}
        {isBoosted(listing.id) ? (
          <p className="mt-2 text-[12px] leading-4 text-[oklch(0.92_0.03_80)]">Boosted</p>
        ) : null}
        {listing.description ? (
          <p className="mt-2 max-w-[34ch] text-[14px] leading-5 text-[oklch(0.93_0.02_85)]">
            {listing.description}
          </p>
        ) : null}
      </div>
    </>
  );
}

function RoundButton({
  label,
  onClick,
  children,
  disabled = false,
  badge = null,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  badge?: number | null;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="relative grid size-14 place-items-center rounded-full border border-[oklch(0.86_0.02_80)] bg-[#FDFBF7] text-[oklch(0.22_0.025_55)] transition-colors duration-200 hover:bg-[oklch(0.96_0.012_82)] disabled:opacity-35"
      style={{ transitionTimingFunction: EASE }}
    >
      {children}
      {badge !== null ? (
        <span className="absolute -top-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-[oklch(0.93_0.018_72)] text-[12px] leading-none tabular-nums text-[oklch(0.32_0.04_52)]">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function DetailsSheet({
  listing,
  onClose,
}: {
  listing: Listing;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const seller = findSeller(listing.sellerUsername);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 z-50 m-0 hidden h-dvh max-h-dvh w-full max-w-none border-0 bg-transparent p-0 open:grid open:place-items-end open:sm:place-items-center [&::backdrop]:bg-[oklch(0.22_0.02_55/0.46)]"
    >
      <button
        type="button"
        aria-label="Dismiss details"
        className="absolute inset-0 cursor-default bg-transparent"
        onClick={onClose}
        tabIndex={-1}
      />
      <div className="relative z-10 max-h-[min(86vh,40rem)] w-full overflow-y-auto rounded-t-[1.75rem] border border-[oklch(0.88_0.018_80)] bg-[#FDFBF7] px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] motion-safe:animate-[sheet-up_220ms_cubic-bezier(0.16,1,0.3,1)_both] sm:mx-auto sm:max-w-[26.5rem] sm:rounded-[1.75rem]">
        {listing.original_photo_url ? (
          <img
            src={listing.original_photo_url}
            alt=""
            className="aspect-[4/5] w-full rounded-[1.25rem] object-cover"
          />
        ) : null}
        <h2 className="mt-4 font-[family-name:var(--font-bodoni)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.22_0.025_55)]">
          {listing.brand}
        </h2>
        <p className="mt-2 text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
          {listing.title} · {listing.size} · {listing.condition}
        </p>
        {seller ? (
          <Link
            href={sellerPath(listing.sellerUsername)}
            className="mt-3 inline-block text-[14px] font-semibold text-[oklch(0.22_0.025_55)] underline decoration-[oklch(0.48_0.12_52)] underline-offset-2"
          >
            {seller.handle}
          </Link>
        ) : null}
        {listing.description ? (
          <p className="mt-3 max-w-[42ch] text-[16px] leading-6 text-[oklch(0.38_0.03_55)]">
            {listing.description}
          </p>
        ) : null}
        <p className="mt-4 text-[20px] font-semibold tabular-nums text-[oklch(0.22_0.025_55)]">
          {formatAed(listing.price)}
          {listing.original_retail_price ? (
            <span className="ml-2 text-[14px] font-normal text-[oklch(0.42_0.03_55)] line-through">
              {formatAed(listing.original_retail_price)}
            </span>
          ) : null}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href={`/checkout/${listing.id}`}
            className="flex h-12 items-center justify-center rounded-full bg-[oklch(0.48_0.12_52)] text-[14px] font-semibold text-[oklch(0.98_0.012_85)]"
          >
            Pay into escrow
          </Link>
          <Link
            href={`/product/${listing.id}`}
            className="flex h-12 items-center justify-center rounded-full text-[14px] font-semibold text-[oklch(0.22_0.025_55)]"
          >
            View lookbook
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 items-center justify-center rounded-full text-[14px] font-semibold text-[oklch(0.22_0.025_55)]"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}

function PassIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4 4 14 14M14 4 4 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function BacktrackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M7.2 5.2 4.5 8l2.7 2.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 8h6.2a4.3 4.3 0 1 1 0 8.6H8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 9.1v4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="6.55" r="0.95" fill="currentColor" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="20" height="18" viewBox="0 0 20 18" fill="none" aria-hidden="true">
      <path
        d="M10 16.2 3.4 9.7a3.9 3.9 0 0 1 0-5.5 3.8 3.8 0 0 1 5.5 0L10 5.4l1.1-1.2a3.8 3.8 0 0 1 5.5 0 3.9 3.9 0 0 1 0 5.5L10 16.2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
