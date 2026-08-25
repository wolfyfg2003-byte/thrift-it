"use client";

import { formatAed } from "@/lib/checkout";
import {
  PLUS_MONTHLY_AED,
  restorePlus,
  usePlus,
} from "@/lib/plus-store";
import { useEffect, useId, useRef, useState } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const SPARKS = [
  { x: "-2.6rem", y: "-3.4rem", delay: "0ms" },
  { x: "2.4rem", y: "-3.1rem", delay: "40ms" },
  { x: "3.4rem", y: "0.2rem", delay: "80ms" },
  { x: "1.8rem", y: "3.2rem", delay: "50ms" },
  { x: "-2.2rem", y: "3rem", delay: "90ms" },
  { x: "-3.4rem", y: "0.4rem", delay: "20ms" },
] as const;

export default function PlusPaywall() {
  const { paywallOpen, plusActive, closePaywall, activatePlus } = usePlus();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<number>(0);
  const [phase, setPhase] = useState<"offer" | "charging" | "thanks" | "active">(
    "offer",
  );

  useEffect(() => {
    restorePlus();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (paywallOpen && !dialog.open) {
      setPhase(plusActive ? "active" : "offer");
      if (!dialog.open) dialog.showModal();
    }
    if (!paywallOpen && dialog.open) {
      dialog.close();
    }
  }, [paywallOpen, plusActive]);

  useEffect(() => {
    return () => window.clearTimeout(closeTimer.current);
  }, []);

  const dismiss = () => {
    window.clearTimeout(closeTimer.current);
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    else closePaywall();
    setPhase("offer");
  };

  const subscribe = () => {
    if (phase === "charging" || phase === "thanks") return;
    setPhase("charging");
    window.setTimeout(() => {
      activatePlus();
      setPhase("thanks");
      closeTimer.current = window.setTimeout(() => {
        dismiss();
      }, 1200);
    }, 720);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onClose={() => {
        closePaywall();
        setPhase("offer");
      }}
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
        className="relative z-10 flex max-h-[min(92dvh,42rem)] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-[oklch(0.88_0.018_80)] bg-[#FDFBF7] shadow-[0_-18px_48px_-28px_oklch(0.22_0.03_55/0.4)] motion-safe:animate-[sheet-up_240ms_cubic-bezier(0.16,1,0.3,1)_both] sm:max-w-[26.5rem] sm:rounded-[1.75rem]"
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

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {phase === "thanks" ? (
            <ThanksBurst />
          ) : phase === "active" ? (
            <>
              <h2
                id={titleId}
                className="font-[family-name:var(--font-bodoni)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.22_0.025_55)]"
              >
                Thrift It Plus is on
              </h2>
              <p className="mt-4 max-w-[40ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
                Unlimited backtracks, and a Verify Profile badge on your closet.
                Demonstration subscription — not a live charge.
              </p>
              <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-[oklch(0.93_0.018_72)] px-3 py-1.5 text-[12px] leading-4 text-[oklch(0.32_0.04_52)]">
                <VerifyIcon />
                Verify Profile
              </p>
              <button
                type="button"
                onClick={dismiss}
                className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-[oklch(0.48_0.12_52)] text-[14px] font-semibold text-[oklch(0.98_0.012_85)]"
                style={{ transitionTimingFunction: EASE }}
              >
                Back to the deck
              </button>
            </>
          ) : (
            <>
              <h2
                id={titleId}
                className="font-[family-name:var(--font-bodoni)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.22_0.025_55)]"
              >
                Unlock Thrift It Plus
              </h2>
              <p className="mt-4 max-w-[40ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
                Three free backtracks a day. Plus restores every pass, and marks
                your closet as verified.
              </p>
              <ul className="mt-6 border-y border-[oklch(0.88_0.018_80)] py-5">
                <li className="text-[16px] leading-6 text-[oklch(0.22_0.025_55)]">
                  Unlimited backtracks
                </li>
                <li className="mt-3 text-[16px] leading-6 text-[oklch(0.22_0.025_55)]">
                  Verify Profile badge
                </li>
              </ul>
              <p className="mt-5 font-[family-name:var(--font-bodoni)] text-[32px] leading-none tracking-[-0.03em] tabular-nums text-[oklch(0.22_0.025_55)]">
                {formatAed(PLUS_MONTHLY_AED)}
                <span className="ml-2 font-[family-name:var(--font-figtree)] text-[14px] font-normal text-[oklch(0.42_0.03_55)]">
                  / month
                </span>
              </p>
              <p className="mt-2 text-[12px] leading-4 text-[oklch(0.5_0.025_55)]">
                Simulated Mamo Pay checkout — not billed.
              </p>
              <button
                type="button"
                onClick={subscribe}
                disabled={phase === "charging"}
                className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[oklch(0.48_0.12_52)] text-[14px] font-semibold text-[oklch(0.98_0.012_85)] transition-colors duration-200 hover:bg-[oklch(0.42_0.12_52)] disabled:bg-[oklch(0.82_0.02_72)] disabled:text-[oklch(0.5_0.02_55)]"
                style={{ transitionTimingFunction: EASE }}
              >
                {phase === "charging"
                  ? "Opening Mamo Pay…"
                  : `Subscribe · ${formatAed(PLUS_MONTHLY_AED)} / month`}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="mt-2 flex h-12 w-full items-center justify-center rounded-full text-[14px] font-semibold text-[oklch(0.22_0.025_55)]"
              >
                Not now
              </button>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}

function ThanksBurst() {
  return (
    <div className="relative flex min-h-[16rem] flex-col items-center justify-center py-8 text-center">
      <div className="relative grid size-16 place-items-center">
        {SPARKS.map((spark, index) => (
          <span
            key={index}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[oklch(0.62_0.13_72)] motion-safe:animate-[plus-spark_720ms_cubic-bezier(0.16,1,0.3,1)_both]"
            style={{
              ["--spark-x" as string]: spark.x,
              ["--spark-y" as string]: spark.y,
              animationDelay: spark.delay,
            }}
          />
        ))}
        <span className="grid size-16 place-items-center rounded-full bg-[oklch(0.945_0.025_70)] text-[oklch(0.42_0.1_52)]">
          <SparkleIcon />
        </span>
      </div>
      <p className="mt-7 font-[family-name:var(--font-bodoni)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.22_0.025_55)]">
        You’re on Plus
      </p>
      <p className="mt-4 max-w-[32ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
        Thank you. Unlimited backtracks are yours — back to the deck.
      </p>
    </div>
  );
}

export function PlusBadge({ compact = false }: { compact?: boolean }) {
  const { plusActive, openPaywall } = usePlus();
  return (
    <button
      type="button"
      onClick={openPaywall}
      aria-label={plusActive ? "Thrift It Plus is on" : "Open Thrift It Plus"}
      className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-semibold leading-4 transition-colors duration-200 ${
        plusActive
          ? "border-[oklch(0.72_0.08_72)] bg-[oklch(0.93_0.04_72)] text-[oklch(0.36_0.08_52)]"
          : "border-[oklch(0.84_0.04_72)] bg-[#FDFBF7] text-[oklch(0.38_0.08_52)] hover:bg-[oklch(0.96_0.02_80)]"
      }`}
      style={{ transitionTimingFunction: EASE }}
    >
      <SparkleIcon />
      {compact ? null : <span>Plus</span>}
    </button>
  );
}

export function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M7 1.2 8.15 5.85 12.8 7 8.15 8.15 7 12.8 5.85 8.15 1.2 7 5.85 5.85 7 1.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3 3l8 8M11 3 3 11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function VerifyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M4 7.1 6.1 9.2 10 5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
