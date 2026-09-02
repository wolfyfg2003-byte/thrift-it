"use client";

import { PolaroidCaption, PolaroidShell } from "@/components/brand/PolaroidShell";
import { DropLock } from "@/components/DropLock";
import OfferModal from "@/components/OfferModal";
import { applyTasteEvent } from "@/app/actions/taste";
import { formatAed } from "@/lib/checkout";
import { isDropLocked } from "@/lib/drop";
import { listingProximityLabel, type GeoPoint } from "@/lib/geo";
import type { Listing } from "@/lib/listings";
import { listingCategory } from "@/lib/taste";
import {
  clearTasteSwipes,
  getTaste,
  hasCalibratedTaste,
  recordTasteEvent,
  undoTasteSwipe,
} from "@/lib/taste-store";
import { consumeBacktrack, isBoosted, openPlusPaywall, usePlusState } from "@/lib/plus-store";
import { findSeller, sellerPath } from "@/lib/sellers";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

const EASE = "cubic-bezier(0.19, 1, 0.22, 1)";
const THRESHOLD = 96;
const EXIT_MS = 340;

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
  const cardRef = useRef<HTMLElement>(null);

  const [now, setNow] = useState(() => Date.now());
  const [insertPulse, setInsertPulse] = useState(false);
  const forcedIdRef = useRef<string | null>(null);
  const restoreIdRef = useRef<string | null>(null);
  const pendingRewindRef = useRef<string | null>(null);
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

    const prefer = restoreIdRef.current;
    if (prefer && nextIds.includes(prefer)) {
      restoreIdRef.current = null;
      setIndex(nextIds.indexOf(prefer));
      return;
    }

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
    clearTasteSwipes();
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
        recordTasteEvent({
          listingId: item.id,
          brand: item.brand,
          category: listingCategory(item),
          event: direction === "right" ? "like" : "pass",
        });
        void applyTasteEvent({
          listingId: item.id,
          brand: item.brand,
          category: listingCategory(item),
          event: direction === "right" ? "like" : "pass",
        });
        if (!hasCalibratedTaste(getTaste())) {
          setIndex((value) => value + 1);
        }
        setDx(0);
        setExit(null);
        setDragging(false);
        if (openOffer) setOfferFor(item);
      }, EXIT_MS);
    },
    [current, exit],
  );

  const hideWatched = useCallback(
    (direction: "left" | "right" = "right") => {
      if (!current || exit) return;
      setExit(direction);
      setDx(direction === "right" ? window.innerWidth : -window.innerWidth);
      window.setTimeout(() => {
        const id = current.id;
        setDx(0);
        setExit(null);
        setDragging(false);
        onWatchHide?.(id);
      }, EXIT_MS);
    },
    [current, exit, onWatchHide],
  );

  const skipLocked = () => {
    if (!current || exit) return;
    setExit("left");
    setDx(-window.innerWidth);
    window.setTimeout(() => {
      setPassedIds((stack) => [...stack, current.id]);
      setIndex((value) => value + 1);
      setDx(0);
      setExit(null);
      setDragging(false);
    }, EXIT_MS);
  };

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (exit || !current) return;
    pointer.current = event.pointerId;
    startX.current = event.clientX;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (pointer.current !== event.pointerId || exit) return;
    setDx(event.clientX - startX.current);
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    if (pointer.current !== event.pointerId) return;
    pointer.current = null;
    setDragging(false);
    if (dx > THRESHOLD) {
      if (currentLocked) hideWatched("right");
      else fly("right", true);
    } else if (dx < -THRESHOLD) {
      if (currentLocked) skipLocked();
      else fly("left", false);
    } else setDx(0);
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

  const completeRewind = useCallback(
    (id: string) => {
      restoreIdRef.current = id;
      undoTasteSwipe(id);
      setPassedIds((stack) => {
        const at = stack.lastIndexOf(id);
        if (at < 0) return stack;
        return [...stack.slice(0, at), ...stack.slice(at + 1)];
      });
      const at = listings.findIndex((item) => item.id === id);
      if (at >= 0) {
        restoreIdRef.current = null;
        setIndex(at);
      }
      setDx(0);
      setExit(null);
    },
    [listings],
  );

  const backtrack = () => {
    if (exit) return;
    if (passedIds.length === 0) return;
    const id = passedIds[passedIds.length - 1];
    if (consumeBacktrack() === "paywall") {
      pendingRewindRef.current = id;
      return;
    }
    completeRewind(id);
  };

  useEffect(() => {
    if (plus.paywallOpen) return;
    const id = pendingRewindRef.current;
    if (!id) return;
    pendingRewindRef.current = null;
    if (plus.plusActive) completeRewind(id);
  }, [plus.paywallOpen, plus.plusActive, completeRewind]);

  const needsPlus = passedIds.length > 0 && !plus.plusActive && plus.freeBacktracksLeft <= 0;
  const canRewind = passedIds.length > 0 && (plus.plusActive || plus.freeBacktracksLeft > 0);
  const backtrackEnabled = canRewind || needsPlus;
  const intent = Math.max(-1, Math.min(1, dx / 140));
  const rotating = dragging || Boolean(exit);
  if (empty) {
    if (listings.length === 0) {
      return (
        <div className="flex flex-1 flex-col justify-center px-1 py-8">
          <h2 className="text-[20px] leading-7 text-[#2A1A14]">
            {emptyTitle ?? (filtersActive ? "Nothing in this cut" : "The rail is empty")}
          </h2>
          <p className="mt-3 max-w-[38ch] text-[16px] leading-6 text-[#6B4A3A]">
            {emptyBody ??
              (filtersActive
                ? "Clear filters to return to the mystery deck."
                : "Check back soon for fresh Dubai closets.")}
          </p>
          {filtersActive && onClearFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-8 flex h-12 items-center justify-center border border-[#2A1A14] bg-[#D8829D] text-[14px] font-semibold text-[#2A1A14] shadow-[4px_4px_0_0_#2A1A14]"
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
      <div className="relative mx-auto w-full max-w-[22.5rem] pr-1 pb-1">
        <div className="relative aspect-[3/4.25]">
          {next ? (
            <PolaroidShell
              tilt={-1}
              className="absolute inset-0"
              caption={
                <PolaroidCaption
                  title={`${next.brand} ${next.title}`}
                  price={formatAed(next.price)}
                  retail={
                    next.original_retail_price
                      ? formatAed(next.original_retail_price)
                      : undefined
                  }
                />
              }
            >
              <Cover listing={next} origin={buyerOrigin} />
              {nextLocked && next.dropTime ? (
                <DropLock dropTime={next.dropTime} interactive={false} />
              ) : null}
            </PolaroidShell>
          ) : null}

          {current ? (
            <PolaroidShell
              key={`${current.id}-${replayKey}`}
              articleRef={cardRef}
              tilt={1}
              className={`absolute inset-0 touch-none ${insertPulse && forceFrontId === current.id ? "motion-safe:animate-[drop-insert_420ms_cubic-bezier(0.19,1,0.22,1)_both]" : ""}`}
              caption={
                <PolaroidCaption
                  title={`${current.brand} ${current.title}`}
                  price={formatAed(current.price)}
                  retail={
                    current.original_retail_price
                      ? formatAed(current.original_retail_price)
                      : undefined
                  }
                  likes={
                    intent > 0.18
                      ? currentLocked
                        ? "notify"
                        : "♥ like"
                      : undefined
                  }
                />
              }
              style={{
                transform: `translateX(${dx}px) rotate(${dx / 22 + 1}deg)`,
                opacity:
                  intent < 0 ? 1 - Math.min(0.72, Math.abs(intent) * 0.72) : 1,
                boxShadow:
                  intent > 0
                    ? `4px 4px 0px 0px #2A1A14, 10px 10px 0px 0px rgba(216,130,157,${intent * 0.55})`
                    : "4px 4px 0px 0px #2A1A14",
                transition:
                  rotating && !dragging
                    ? `transform ${EXIT_MS}ms ${EASE}, opacity ${EXIT_MS}ms ${EASE}, box-shadow ${EXIT_MS}ms ${EASE}`
                    : "none",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <Cover listing={current} origin={buyerOrigin} />
              {currentLocked && current.dropTime ? (
                <DropLock
                  dropTime={current.dropTime}
                  interactive
                  onNotify={() => hideWatched("right")}
                />
              ) : null}
              {Math.abs(intent) > 0.18 ? (
                <p
                  className={`pointer-events-none absolute top-4 z-30 font-[family-name:var(--font-handwritten)] text-[28px] leading-none ${
                    intent > 0
                      ? "right-3 rotate-12 text-[#D8829D]"
                      : "left-3 -rotate-12 text-[#4B6584]"
                  }`}
                >
                  {intent > 0 ? (currentLocked ? "Notify!" : "Like!") : "Pass"}
                </p>
              ) : null}
            </PolaroidShell>
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
            if (currentLocked) {
              skipLocked();
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
          onOfferSubmitted={() => {
            recordTasteEvent({
              listingId: offerFor.id,
              brand: offerFor.brand,
              category: listingCategory(offerFor),
              event: "offer",
            });
            void applyTasteEvent({
              listingId: offerFor.id,
              brand: offerFor.brand,
              category: listingCategory(offerFor),
              event: "offer",
            });
          }}
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
        className="grid size-16 place-items-center border border-[#2A1A14] bg-[#E4D5C1] text-[#2A1A14] shadow-[3px_3px_0_0_#2A1A14]"
      >
        <HangerMark />
      </span>
      <h2 className="mt-7 text-[32px] leading-none text-[#2A1A14]">
        Detox Completed
      </h2>
      <p className="mt-4 max-w-[36ch] font-[family-name:var(--font-handwritten)] text-[18px] leading-6 text-[#6B4A3A]">
        You have detoxed the catalog! Check back soon for fresh closets.
      </p>
      {!plusActive ? (
        <div className="relative mt-8 w-full max-w-[18.5rem] border border-[#2A1A14] bg-[#F4EFE6] px-4 py-5 text-left shadow-[4px_4px_0_0_#2A1A14]">
          <span aria-hidden className="washi-grain pointer-events-none absolute -top-2 left-5 h-4 w-16 -rotate-6 bg-[rgba(241,196,15,0.8)]" />
          <p className="font-[family-name:var(--font-typewriter)] text-[18px] leading-7 text-[#2A1A14]">
            Thrift It Plus
          </p>
          <p className="mt-2 max-w-[34ch] text-[14px] leading-5 text-[#6B4A3A]">
            Unlimited backtracks so the next closet doesn’t cost you a pass.
          </p>
          <button
            type="button"
            onClick={() => openPlusPaywall("plus")}
            className="mt-4 flex h-11 w-full items-center justify-center border border-[#2A1A14] bg-[#D8829D] text-[14px] font-semibold text-[#2A1A14] shadow-[3px_3px_0_0_#2A1A14]"
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
          className="flex h-12 items-center justify-center border border-[#2A1A14] bg-[#F4EFE6] text-[14px] font-semibold text-[#2A1A14] shadow-[3px_3px_0_0_#2A1A14]"
          style={{ transitionTimingFunction: EASE }}
        >
          Replay Deck
        </button>
        <Link
          href="/sell"
          className="flex h-12 items-center justify-center border border-[#2A1A14] bg-[#4B6584] text-[14px] font-semibold text-[#F9F6F0] shadow-[3px_3px_0_0_#2A1A14]"
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
        <div className="grid size-full place-items-center bg-[#E4D5C1] font-[family-name:var(--font-display)] text-[48px] text-[#2A1A14]">
          {listing.brand.slice(0, 1)}
        </div>
      )}
      <p className="absolute top-3 left-3 inline-flex max-w-[min(100%-1.5rem,14rem)] items-center gap-1 bg-[rgba(241,196,15,0.8)] px-2 py-1 font-[family-name:var(--font-handwritten)] text-[13px] leading-4 text-[#2A1A14] -rotate-2">
        <PinIcon />
        <span className="truncate" suppressHydrationWarning>
          {place}
        </span>
      </p>
      <div className="absolute right-2 bottom-2 left-2 flex items-end justify-between gap-2">
        {seller ? (
          <Link
            href={sellerPath(listing.sellerUsername)}
            onPointerDown={(event) => event.stopPropagation()}
            className="relative z-10 bg-[#F4EFE6]/90 px-1.5 font-[family-name:var(--font-handwritten)] text-[13px] leading-4 text-[#2A1A14] underline decoration-[#4B6584] underline-offset-2"
          >
            {seller.handle}
          </Link>
        ) : (
          <span />
        )}
        {isBoosted(listing.id) ? (
          <p className="font-[family-name:var(--font-handwritten)] text-[13px] leading-4 text-[#D8829D]">
            Boosted
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
      className="relative grid size-14 place-items-center border border-[#2A1A14] bg-[#F4EFE6] text-[#2A1A14] shadow-[3px_3px_0_0_#2A1A14] transition-colors duration-200 hover:bg-[#E4D5C1] disabled:opacity-35"
      style={{ transitionTimingFunction: EASE }}
    >
      {children}
      {badge !== null ? (
        <span className="absolute -top-1 -right-1 grid size-5 place-items-center border border-[#2A1A14] bg-[#D8829D] font-[family-name:var(--font-handwritten)] text-[12px] leading-none tabular-nums text-[#2A1A14]">
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
      className="fixed inset-0 z-50 m-0 hidden h-dvh max-h-dvh w-full max-w-none border-0 bg-transparent p-0 open:grid open:place-items-end open:sm:place-items-center [&::backdrop]:bg-[#2A1A14]/45"
    >
      <button
        type="button"
        aria-label="Dismiss details"
        className="absolute inset-0 cursor-default bg-transparent"
        onClick={onClose}
        tabIndex={-1}
      />
      <div className="cardboard-sheet relative z-10 max-h-[min(86vh,40rem)] w-full overflow-y-auto border border-[#2A1A14] px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[4px_4px_0_0_#2A1A14] motion-safe:animate-[sheet-up_220ms_cubic-bezier(0.16,1,0.3,1)_both] sm:mx-auto sm:max-w-[26.5rem]">
        <span aria-hidden className="washi-grain pointer-events-none absolute -top-2 left-8 h-4 w-[4.5rem] -rotate-6 bg-[rgba(241,196,15,0.8)]" />
        {listing.original_photo_url ? (
          <img
            src={listing.original_photo_url}
            alt=""
            className="aspect-[4/5] w-full border border-[#2A1A14] object-cover"
          />
        ) : null}
        <h2 className="mt-4 font-[family-name:var(--font-typewriter)] text-[24px] leading-none text-[#2A1A14]">
          {listing.brand}
        </h2>
        <p className="mt-2 text-[16px] leading-6 text-[#6B4A3A]">
          {listing.title} · {listing.size} · {listing.condition}
        </p>
        {seller ? (
          <Link
            href={sellerPath(listing.sellerUsername)}
            className="mt-3 inline-block font-[family-name:var(--font-handwritten)] text-[16px] text-[#2A1A14] underline decoration-[#4B6584] underline-offset-2"
          >
            {seller.handle}
          </Link>
        ) : null}
        {listing.description ? (
          <p className="mt-3 max-w-[42ch] text-[16px] leading-6 text-[#6B4A3A]">
            {listing.description}
          </p>
        ) : null}
        <p className="mt-4 font-[family-name:var(--font-handwritten)] text-[22px] text-[#2A1A14]">
          {formatAed(listing.price)}
          {listing.original_retail_price ? (
            <span className="ml-2 text-[14px] text-[#6B4A3A] line-through">
              {formatAed(listing.original_retail_price)}
            </span>
          ) : null}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href={`/checkout/${listing.id}`}
            className="flex h-12 items-center justify-center border border-[#2A1A14] bg-[#D8829D] text-[14px] font-semibold text-[#2A1A14] shadow-[3px_3px_0_0_#2A1A14]"
          >
            Pay into escrow
          </Link>
          <Link
            href={`/product/${listing.id}`}
            className="flex h-12 items-center justify-center border border-[#2A1A14] bg-[#F4EFE6] text-[14px] font-semibold text-[#2A1A14]"
          >
            View lookbook
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 items-center justify-center text-[14px] font-semibold text-[#2A1A14]"
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
