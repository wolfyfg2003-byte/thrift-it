"use client";

import { useEffect, useState } from "react";

const EASE = "cubic-bezier(0.19, 1, 0.22, 1)";
const GOLD = "#2A1A14";
const INK = "#2A1A14";

const PLATES = [
  { src: "/deck/atelier-noor.png", x: "-18%", rotate: "-8deg", delay: "80ms" },
  { src: "/deck/zimmermann-floral.png", x: "0%", rotate: "2deg", delay: "180ms" },
  { src: "/deck/house-of-cb.png", x: "18%", rotate: "7deg", delay: "280ms" },
] as const;

export function WardrobeLoading({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hold = 1800;
    const fade = reduced ? 240 : 560;
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
        leaving ? "wardrobe-load-out" : "wardrobe-load-in"
      }`}
      role="status"
      aria-live="polite"
      aria-label="Your wardrobe is loading"
    >
      <div className="flex w-full max-w-[22rem] flex-col items-center">
        <div className="relative h-36 w-full" aria-hidden>
          {PLATES.map((plate) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={plate.src}
              src={plate.src}
              alt=""
              className="wardrobe-plate absolute top-0 left-1/2 h-36 w-24 border border-[#2A1A14] bg-[#F4EFE6] object-cover p-1 pb-5 shadow-[4px_4px_0_0_#2A1A14]"
              style={{
                borderColor: GOLD,
                transform: `translateX(-50%) translateX(${plate.x}) rotate(${plate.rotate})`,
                animationDelay: plate.delay,
                transitionTimingFunction: EASE,
              }}
            />
          ))}
        </div>
        <h2
          className="wardrobe-load-copy mt-10 text-center font-[family-name:var(--font-display)] text-[28px] leading-none font-semibold tracking-[-0.03em]"
          style={{ color: INK }}
        >
          Your wardrobe is loading
        </h2>
        <span
          className="welcome-boot-line mt-6 block h-3 w-16 origin-center -rotate-2"
          style={{ background: "rgba(241, 196, 15, 0.8)" }}
          aria-hidden
        />
      </div>
    </div>
  );
}
