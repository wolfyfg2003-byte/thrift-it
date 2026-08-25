"use client";

import { BoltIcon } from "@/components/DropIcons";
import { useState } from "react";

type LiveDropBannerProps = {
  title: string;
  onOpen: () => void;
  onDismiss: () => void;
};

export function LiveDropBanner({ title, onOpen, onDismiss }: LiveDropBannerProps) {
  const [leaving, setLeaving] = useState(false);

  const leave = (then: () => void) => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(then, 220);
  };

  return (
    <div className="pointer-events-none fixed top-0 left-1/2 z-50 w-full max-w-[28rem] -translate-x-1/2 px-5 pt-[max(0.7rem,env(safe-area-inset-top))]">
      <div
        className={`pointer-events-auto flex items-start gap-3 rounded-[1.15rem] border border-[oklch(0.78_0.07_72)] bg-[oklch(0.93_0.05_82)] px-3.5 py-3 shadow-[0_16px_40px_-12px_oklch(0.45_0.08_70_/_0.22)] ${
          leaving ? "drop-banner-out" : "drop-banner"
        }`}
      >
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[oklch(0.48_0.12_52)] text-[oklch(0.985_0.01_85)]">
          <BoltIcon />
        </span>
        <button type="button" onClick={() => leave(onOpen)} className="min-w-0 flex-1 text-left">
          <p className="font-[family-name:var(--font-bodoni)] text-[20px] leading-6 tracking-[-0.02em] text-[oklch(0.26_0.04_55)]">
            LIVE DROP: The {title} is now unlocked!
          </p>
          <p className="mt-1 text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
            Tap to swipe it first.
          </p>
        </button>
        <button
          type="button"
          onClick={() => leave(onDismiss)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[oklch(0.4_0.03_55)]"
          aria-label="Dismiss live drop"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
            <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
