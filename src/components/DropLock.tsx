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
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-center bg-[#F4EFE6]/78 px-5 py-8 backdrop-blur-[8px]">
      <div className="relative space-y-4">
        <p className="font-[family-name:var(--font-display)] text-[32px] leading-none text-[#2A1A14] tabular-nums">
          Unlocks in {formatUnlockCountdown(remaining)}
        </p>
        {interactive ? (
          <>
            <button
              type="button"
              onClick={onNotify}
              onPointerDown={(event) => event.stopPropagation()}
              className="pointer-events-auto inline-flex min-h-12 w-full items-center justify-center gap-2 border border-[#2A1A14] bg-[#D8829D] px-5 text-[14px] font-semibold text-[#2A1A14] shadow-[4px_4px_0_0_#2A1A14]"
            >
              <BellIcon />
              Notify Me when Live
            </button>
            <p className="font-[family-name:var(--font-handwritten)] text-[16px] leading-5 text-[#6B4A3A]">
              or swipe right to watch
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
