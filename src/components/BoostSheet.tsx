"use client";

import { formatAed } from "@/lib/checkout";
import type { Listing } from "@/lib/listings";
import {
  BOOST_AED,
  BOOST_HOURS,
  closeBoostCheckout,
  confirmBoost,
  usePlus,
} from "@/lib/plus-store";
import { useEffect, useId, useRef, useState } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function BoostSheet({ listings }: { listings: Listing[] }) {
  const { boostListingId } = usePlus();
  const listing = listings.find((item) => item.id === boostListingId) ?? null;
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [phase, setPhase] = useState<"offer" | "charging" | "done">("offer");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (listing && !dialog.open) {
      setPhase("offer");
      dialog.showModal();
    }
  }, [listing]);

  if (!listing) return null;

  const dismiss = () => {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    else closeBoostCheckout();
  };

  const pay = () => {
    setPhase("charging");
    window.setTimeout(() => {
      confirmBoost(listing.id);
      setPhase("done");
    }, 900);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onClose={closeBoostCheckout}
      className="fixed inset-0 z-50 m-0 hidden h-dvh max-h-dvh w-full max-w-none border-0 bg-transparent p-0 open:grid open:place-items-end open:sm:place-items-center [&::backdrop]:bg-[oklch(0.22_0.02_55/0.46)]"
    >
      <button
        type="button"
        aria-label="Dismiss boost"
        className="absolute inset-0 cursor-default bg-transparent"
        onClick={dismiss}
        tabIndex={-1}
      />
      <div className="relative z-10 w-full max-h-[min(92dvh,42rem)] overflow-y-auto overscroll-contain rounded-t-[1.75rem] border border-[oklch(0.88_0.018_80)] bg-[#FDFBF7] px-5 pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-18px_48px_-28px_oklch(0.22_0.03_55/0.4)] motion-safe:animate-[sheet-up_220ms_cubic-bezier(0.16,1,0.3,1)_both] sm:max-w-[26.5rem] sm:rounded-[1.75rem]">
        {phase === "done" ? (
          <>
            <h2
              id={titleId}
              className="font-[family-name:var(--font-bodoni)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.22_0.025_55)]"
            >
              At the front of the deck
            </h2>
            <p className="mt-4 max-w-[40ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
              {listing.brand} sits at the top of everyone’s swipe stack for{" "}
              {BOOST_HOURS} hours. Demonstration boost — not a live charge.
            </p>
            <button
              type="button"
              onClick={dismiss}
              className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-[oklch(0.48_0.12_52)] text-[14px] font-semibold text-[oklch(0.98_0.012_85)]"
              style={{ transitionTimingFunction: EASE }}
            >
              Done
            </button>
          </>
        ) : (
          <>
            <h2
              id={titleId}
              className="font-[family-name:var(--font-bodoni)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.22_0.025_55)]"
            >
              Boost this listing
            </h2>
            <div className="mt-5 flex items-center gap-3 rounded-[1.1rem] bg-[oklch(0.96_0.01_82)] p-2 pr-3">
              {listing.original_photo_url ? (
                <img
                  src={listing.original_photo_url}
                  alt=""
                  className="size-14 rounded-[0.8rem] border border-[oklch(0.88_0.018_80)] object-cover"
                />
              ) : null}
              <div className="min-w-0">
                <p className="truncate text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
                  {listing.brand}
                </p>
                <p className="truncate text-[16px] font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
                  {listing.title}
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-[40ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
              Pin it to the top of every buyer’s deck for {BOOST_HOURS} hours.
            </p>
            <p className="mt-5 font-[family-name:var(--font-bodoni)] text-[32px] leading-none tracking-[-0.03em] tabular-nums text-[oklch(0.22_0.025_55)]">
              {formatAed(BOOST_AED)}
            </p>
            <p className="mt-2 text-[12px] leading-4 text-[oklch(0.5_0.025_55)]">
              Simulated checkout — not billed.
            </p>
            <button
              type="button"
              onClick={pay}
              disabled={phase === "charging"}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[oklch(0.48_0.12_52)] text-[14px] font-semibold text-[oklch(0.98_0.012_85)] disabled:bg-[oklch(0.82_0.02_72)] disabled:text-[oklch(0.5_0.02_55)]"
              style={{ transitionTimingFunction: EASE }}
            >
              {phase === "charging"
                ? "Charging…"
                : `Boost for ${formatAed(BOOST_AED)}`}
            </button>
            <button
              type="button"
              onClick={dismiss}
              disabled={phase === "charging"}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-full text-[14px] font-semibold text-[oklch(0.22_0.025_55)] disabled:opacity-40"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </dialog>
  );
}
