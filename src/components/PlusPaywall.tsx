"use client";

import { StampBadge } from "@/components/brand/StampBadge";
import { WashiTape } from "@/components/brand/WashiTape";
import { formatAed } from "@/lib/checkout";
import {
  PLUS_MONTHLY_AED,
  restorePlus,
  usePlus,
} from "@/lib/plus-store";
import { useEffect, useId, useRef, useState } from "react";

const EASE = "cubic-bezier(0.19, 1, 0.22, 1)";

const PLUS_CLIPS = [
  { ch: "P", fill: "bg-[#E4D5C1]", rot: -6 },
  { ch: "L", fill: "bg-[#D8829D]", rot: 4 },
  { ch: "U", fill: "bg-[#4B6584] text-[#F9F6F0]", rot: -3 },
  { ch: "S", fill: "bg-[#E4D5C1]", rot: 7 },
] as const;

export default function PlusPaywall() {
  const { paywallOpen, paywallReason, plusActive, closePaywall, activatePlus } =
    usePlus();
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
      dialog.showModal();
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
      className="fixed inset-0 z-50 m-0 h-dvh max-h-dvh w-full max-w-none border-0 bg-transparent p-0 open:grid open:place-items-end open:sm:place-items-center [&::backdrop]:bg-[#2A1A14]/45"
    >
      <button
        type="button"
        aria-label="Close Thrift It Plus"
        className="absolute inset-0 cursor-default bg-transparent"
        onClick={dismiss}
        tabIndex={-1}
      />
      <div
        className="cardboard-sheet relative z-10 flex max-h-[min(92dvh,42rem)] w-full flex-col overflow-hidden border border-[#2A1A14] shadow-[4px_4px_0_0_#2A1A14] motion-safe:animate-[sheet-up_240ms_cubic-bezier(0.19,1,0.22,1)_both] sm:max-w-[26.5rem]"
        role="document"
      >
        <WashiTape tone="mustard" corner="tl" />
        <WashiTape tone="rose" corner="tr" />
        <div className="flex items-center justify-end px-4 pt-3">
          <button
            type="button"
            aria-label="Close"
            onClick={dismiss}
            className="grid size-10 place-items-center border border-[#2A1A14] bg-[#F4EFE6] text-[#2A1A14] shadow-[2px_2px_0_0_#2A1A14]"
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
              <PlusMark />
              <h2
                id={titleId}
                className="mt-5 text-[32px] leading-none text-[#2A1A14]"
              >
                Thrift It Plus is on
              </h2>
              <p className="mt-4 max-w-[40ch] text-[16px] leading-6 text-[#6B4A3A]">
                Unlimited rewinds, and a Verify Profile stamp on your closet.
                Demonstration subscription — not a live charge.
              </p>
              <p className="mt-6 inline-flex items-center gap-2 border border-dashed border-[#2A1A14] bg-[#F4EFE6] px-3 py-2 font-[family-name:var(--font-typewriter)] text-[12px] leading-4 text-[#2A1A14]">
                <VerifyIcon />
                Verify Profile
              </p>
              <button
                type="button"
                onClick={dismiss}
                className="mt-8 flex h-12 w-full items-center justify-center border border-[#2A1A14] bg-[#D8829D] text-[14px] font-semibold text-[#2A1A14] shadow-[4px_4px_0_0_#2A1A14]"
                style={{ transitionTimingFunction: EASE }}
              >
                Back to the deck
              </button>
            </>
          ) : (
            <>
              <PlusMark />
              <h2
                id={titleId}
                className="mt-5 text-[32px] leading-none text-[#2A1A14]"
              >
                Unlock Thrift It Plus
              </h2>
              <p className="mt-4 max-w-[40ch] font-[family-name:var(--font-handwritten)] text-[18px] leading-6 text-[#6B4A3A]">
                {paywallReason === "rewind"
                  ? "You used today’s three free rewinds. Plus puts every pass back on the rail."
                  : "Three free rewinds a day. Plus restores every pass, and stamps your closet as verified."}
              </p>
              <ul className="mt-6 border-y border-[#2A1A14] py-5">
                <li className="relative font-[family-name:var(--font-typewriter)] text-[16px] leading-6 text-[#2A1A14]">
                  <span
                    aria-hidden
                    className="washi-grain pointer-events-none absolute -left-2 top-0 h-5 w-28 -rotate-2 bg-[rgba(241,196,15,0.8)]"
                  />
                  <span className="relative">Unlimited rewinds</span>
                </li>
                <li className="mt-3 font-[family-name:var(--font-typewriter)] text-[16px] leading-6 text-[#2A1A14]">
                  Verify Profile stamp
                </li>
              </ul>
              <p className="mt-5 font-[family-name:var(--font-handwritten)] text-[32px] leading-none tabular-nums text-[#2A1A14]">
                {formatAed(PLUS_MONTHLY_AED)}
                <span className="ml-2 font-[family-name:var(--font-typewriter)] text-[14px] font-normal text-[#6B4A3A]">
                  / month
                </span>
              </p>
              <p className="mt-2 font-[family-name:var(--font-typewriter)] text-[12px] leading-4 text-[#6B4A3A]">
                Simulated Mamo Pay checkout — not billed.
              </p>
              <button
                type="button"
                onClick={subscribe}
                disabled={phase === "charging"}
                className="mt-6 flex h-12 w-full items-center justify-center border border-[#2A1A14] bg-[#D8829D] text-[14px] font-semibold text-[#2A1A14] shadow-[4px_4px_0_0_#2A1A14] disabled:bg-[#C9B8A4] disabled:text-[#6B4A3A] disabled:shadow-none"
                style={{ transitionTimingFunction: EASE }}
              >
                {phase === "charging"
                  ? "Opening Mamo Pay…"
                  : `Subscribe · ${formatAed(PLUS_MONTHLY_AED)} / month`}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="mt-2 flex h-12 w-full items-center justify-center text-[14px] font-semibold text-[#2A1A14]"
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

function PlusMark() {
  return (
    <span aria-hidden className="inline-flex items-center gap-[0.2rem]">
      {PLUS_CLIPS.map((clip) => (
        <span
          key={clip.ch}
          className={`inline-block border border-[#2A1A14] px-2 py-1 font-[family-name:var(--font-display)] text-[18px] leading-none text-[#2A1A14] shadow-[2px_2px_0_0_#2A1A14] ${clip.fill}`}
          style={{ transform: `rotate(${clip.rot}deg)` }}
        >
          {clip.ch}
        </span>
      ))}
    </span>
  );
}

function ThanksBurst() {
  return (
    <div className="relative flex min-h-[16rem] flex-col items-center justify-center py-8 text-center">
      <StampBadge label="PLUS" />
      <p className="mt-7 text-[32px] leading-none text-[#2A1A14]">
        You’re on Plus
      </p>
      <p className="mt-4 max-w-[32ch] font-[family-name:var(--font-handwritten)] text-[18px] leading-6 text-[#6B4A3A]">
        Unlimited rewinds are yours — back to the last pass.
      </p>
    </div>
  );
}

export function PlusBadge({ compact = false }: { compact?: boolean }) {
  const { plusActive, openPaywall } = usePlus();
  return (
    <button
      type="button"
      onClick={() => openPaywall()}
      aria-label={plusActive ? "Thrift It Plus is on" : "Open Thrift It Plus"}
      className={`flex h-10 shrink-0 items-center gap-1.5 border border-[#2A1A14] px-2.5 font-[family-name:var(--font-typewriter)] text-[12px] leading-4 shadow-[2px_2px_0_0_#2A1A14] ${
        plusActive ? "bg-[#D8829D] text-[#2A1A14]" : "bg-[#F4EFE6] text-[#2A1A14]"
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
