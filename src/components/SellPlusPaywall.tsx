"use client";

import { formatAed } from "@/lib/checkout";
import { useEffect, useId, useRef, useState } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const PLUS_NOW = 19;
const PLUS_WAS = 39;

const FEATURES = [
  {
    title: "Unlimited Backtracks",
    body: "Never lose a gem you accidentally swiped left on.",
    icon: "backtrack",
  },
  {
    title: "Early Access",
    body: "Browse VIP and Influencer drops one hour before the rail opens.",
    icon: "bolt",
  },
  {
    title: "1 Scheduled Live Drop a month",
    body: "Queue your closet at the top of the platform.",
    icon: "bell",
  },
  {
    title: "0% seller commission",
    body: "Keep 100% of your earnings on standard sales.",
    icon: "box",
  },
] as const;

type SellPlusPaywallProps = {
  open: boolean;
  onClose: () => void;
  onUnlocked: () => void;
};

export function SellPlusPaywall({ open, onClose, onUnlocked }: SellPlusPaywallProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [phase, setPhase] = useState<"offer" | "thanks">("offer");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setPhase("offer");
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const dismiss = () => {
    setPhase("offer");
    onClose();
  };

  const unlock = () => {
    if (phase !== "offer") return;
    setPhase("thanks");
    window.setTimeout(() => {
      onUnlocked();
      setPhase("offer");
    }, 1100);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onClose={onClose}
      className="fixed inset-0 z-50 m-0 h-dvh max-h-dvh w-full max-w-none border-0 bg-transparent p-0 open:grid open:place-items-end open:sm:place-items-center [&::backdrop]:bg-[oklch(0.22_0.02_55/0.5)]"
    >
      <button
        type="button"
        aria-label="Close Thrift It Plus"
        className="absolute inset-0 cursor-default bg-transparent"
        onClick={dismiss}
        tabIndex={-1}
      />
      <div
        className="relative z-10 flex max-h-[min(94dvh,44rem)] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-[oklch(0.88_0.018_80)] bg-[#FDFBF7] shadow-[0_-18px_48px_-28px_oklch(0.22_0.03_55/0.4)] motion-safe:animate-[sheet-up_240ms_cubic-bezier(0.16,1,0.3,1)_both] sm:max-w-[26.5rem] sm:rounded-[1.75rem]"
        role="document"
      >
        <div className="flex items-center justify-end px-4 pt-3">
          <button
            type="button"
            aria-label="Close"
            onClick={dismiss}
            className="grid size-10 place-items-center rounded-full text-[oklch(0.22_0.025_55)] transition-colors duration-200 hover:bg-[oklch(0.96_0.012_82)]"
            style={{ transitionTimingFunction: EASE }}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">
          {phase === "thanks" ? (
            <UnlockBurst />
          ) : (
            <>
              <h2
                id={titleId}
                className="font-[family-name:var(--font-bodoni)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.22_0.025_55)]"
              >
                Unlock Thrift It Plus
              </h2>
              <p className="mt-4 max-w-[40ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
                One live drop a month, unlimited backtracks, and early access to
                partner closets. Demonstration checkout — not billed.
              </p>

              <div className="mt-7">
                <p className="font-[family-name:var(--font-bodoni)] text-[20px] leading-7 tracking-[-0.02em] text-[oklch(0.36_0.08_52)]">
                  Founding Member Special
                </p>
                <p className="mt-2 font-[family-name:var(--font-bodoni)] text-[32px] leading-none tracking-[-0.03em] tabular-nums text-[oklch(0.22_0.025_55)]">
                  {formatAed(PLUS_NOW)}
                  <span className="ml-2 font-[family-name:var(--font-figtree)] text-[14px] font-normal text-[oklch(0.42_0.03_55)]">
                    / month
                  </span>
                  <span className="ml-2 font-[family-name:var(--font-figtree)] text-[14px] font-normal text-[oklch(0.5_0.03_55)] line-through">
                    {formatAed(PLUS_WAS)} / month
                  </span>
                </p>
              </div>

              <ul className="mt-7 border-t border-[oklch(0.88_0.018_80)]">
                {FEATURES.map((feature) => (
                  <li
                    key={feature.title}
                    className="flex gap-3 border-b border-[oklch(0.88_0.018_80)] py-3.5"
                  >
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[oklch(0.945_0.03_72)] text-[oklch(0.4_0.1_52)]">
                      <FeatureIcon name={feature.icon} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[16px] leading-6 font-semibold text-[oklch(0.22_0.025_55)]">
                        {feature.title}
                      </p>
                      <p className="mt-1 max-w-[36ch] text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
                        {feature.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        {phase === "offer" ? (
          <div className="shrink-0 border-t border-[oklch(0.88_0.018_80)] bg-[#FDFBF7] px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={unlock}
              className="flex h-12 w-full items-center justify-center rounded-full bg-[oklch(0.48_0.12_52)] text-[14px] font-semibold text-[oklch(0.98_0.012_85)] transition-colors duration-200 hover:bg-[oklch(0.42_0.12_52)]"
              style={{ transitionTimingFunction: EASE }}
            >
              Unlock Plus
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-full text-[14px] font-semibold text-[oklch(0.22_0.025_55)]"
            >
              Not now
            </button>
          </div>
        ) : null}
      </div>
    </dialog>
  );
}

function UnlockBurst() {
  return (
    <div className="flex min-h-[18rem] flex-col items-center justify-center py-8 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-[oklch(0.48_0.12_52)] text-[oklch(0.985_0.01_85)] motion-safe:animate-[drop-insert_420ms_cubic-bezier(0.16,1,0.3,1)_both]">
        <CheckIcon />
      </span>
      <p className="mt-7 font-[family-name:var(--font-bodoni)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.22_0.025_55)]">
        You’re on Plus
      </p>
      <p className="mt-4 max-w-[32ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
        One live drop this month is unlocked. Schedule it on the listing.
      </p>
    </div>
  );
}

function FeatureIcon({ name }: { name: (typeof FEATURES)[number]["icon"] }) {
  if (name === "backtrack") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path d="M5 3.4 3.1 5.2 5 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3.4 5.2H8a3.1 3.1 0 1 1 0 6.2H6.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "bolt") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M13.2 3.2 6.4 13.1c-.28.4 0 .9.48.9h4.22l-.7 6.4c-.08.7.8 1.1 1.24.55l6.9-9.9c.27-.4 0-.9-.48-.9h-4.3l.78-6.4c.08-.68-.8-1.08-1.24-.55Z" />
      </svg>
    );
  }
  if (name === "bell") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6.2 9.4a5.8 5.8 0 0 1 11.6 0c0 3.4.9 4.8 1.5 5.6.3.4 0 1-.5 1H5.2c-.5 0-.8-.6-.5-1 .6-.8 1.5-2.2 1.5-5.6Z" stroke="currentColor" strokeWidth="1.7" />
        <path d="M10 18.4a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2.4 4.4 7 2.4l4.6 2v7.2L7 13.6 2.4 11.6V4.4Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 2.6v11" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <path d="M5 11.2 9.1 15.2 17 6.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M3 3l8 8M11 3 3 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
