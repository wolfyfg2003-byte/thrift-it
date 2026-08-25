"use client";

import { BellIcon } from "@/components/DropIcons";
import { formatUnlockCountdown, remainingDropMs } from "@/lib/drop";
import { useEffect, useState } from "react";

type DropLockProps = {
  dropTime: string;
  interactive: boolean;
  onNotify?: () => void;
};

export function DropLock({ dropTime, interactive, onNotify }: DropLockProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const remaining = remainingDropMs(dropTime, now);
  if (remaining <= 0) return null;

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-center bg-[oklch(0.78_0.09_78_/_0.42)] px-5 py-8 backdrop-blur-[18px]">
      <div className="pointer-events-none absolute inset-0 bg-[oklch(0.72_0.1_72_/_0.16)]" />
      <div className="relative space-y-5">
        <p className="font-[family-name:var(--font-bodoni)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.22_0.03_55)] tabular-nums">
          Unlocks in {formatUnlockCountdown(remaining)}
        </p>
        {interactive ? (
          <button
            type="button"
            onClick={onNotify}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[oklch(0.48_0.12_52)] px-5 text-[14px] font-semibold text-[oklch(0.985_0.01_85)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98]"
          >
            <BellIcon />
            Notify Me when Live
          </button>
        ) : null}
      </div>
    </div>
  );
}
