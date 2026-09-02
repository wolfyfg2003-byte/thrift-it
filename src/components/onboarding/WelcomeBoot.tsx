"use client";

import { RansomLogo } from "@/components/brand/RansomLogo";
import { useEffect, useState } from "react";

export function WelcomeBoot({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hold = 2200;
    const fade = reduced ? 280 : 560;
    const leaveAt = window.setTimeout(() => setLeaving(true), hold);
    const doneAt = window.setTimeout(onDone, hold + fade);
    return () => {
      window.clearTimeout(leaveAt);
      window.clearTimeout(doneAt);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center bg-[#F9F6F0] px-8 ${
        leaving ? "welcome-boot-out" : ""
      }`}
      role="status"
      aria-live="polite"
    >
      <h1 className="welcome-boot-mark flex w-full max-w-[22rem] flex-col items-center text-center text-[#2A1A14]">
        <span className="font-[family-name:var(--font-handwritten)] text-[20px] leading-7">
          Welcome to
        </span>
        <span className="mt-4">
          <RansomLogo href={false} size="hero" />
        </span>
        <span
          className="welcome-boot-line mt-6 block h-3 w-28 origin-center -rotate-2 bg-[rgba(241,196,15,0.8)]"
          aria-hidden
        />
        <span className="welcome-boot-sub mt-6 max-w-[26ch] font-[family-name:var(--font-typewriter)] text-[15px] leading-6 text-[#6B4A3A]">
          Dubai closets, photographed, held in escrow.
        </span>
      </h1>
    </div>
  );
}
