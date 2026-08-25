"use client";

import { formatAed } from "@/lib/checkout";
import type { PreviewPlate } from "@/lib/listings";
import { Heart, Info, MapPin, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

const EASE = "cubic-bezier(0.25, 1, 0.5, 1)";
const HOLD_MS = 1700;
const DRIFT_MS = 520;
const FLY_MS = 340;
const DRIFT_PX = 78;
const FLY_PX = 430;

type Stage = "hold" | "drift" | "fly";

type SwipePreviewProps = {
  plates: PreviewPlate[];
};

export function SwipePreview({ plates }: SwipePreviewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [dx, setDx] = useState(0);
  const [stage, setStage] = useState<Stage>("hold");
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [reduced, setReduced] = useState(false);

  const count = plates.length;
  const front = plates[index] ?? null;
  const behind = count > 1 ? plates[(index + 1) % count] : null;
  const offering = index % 2 === 0;
  const dir = offering ? 1 : -1;
  const intent = Math.max(0, Math.min(1, dx / 140));
  const moving = stage !== "hold";

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio > 0.35),
      { threshold: [0, 0.35, 1] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVis = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (reduced || !inView || !pageVisible || count < 2) return;
    let cancelled = false;
    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(window.setTimeout(resolve, ms));
      });

    const loop = async () => {
      while (!cancelled) {
        setStage("hold");
        setDx(0);
        await wait(HOLD_MS);
        if (cancelled) return;
        setStage("drift");
        setDx(DRIFT_PX);
        await wait(DRIFT_MS);
        if (cancelled) return;
        setStage("fly");
        setDx(FLY_PX);
        await wait(FLY_MS);
        if (cancelled) return;
        setDx(0);
        setStage("hold");
        setIndex((current) => (current + 1) % count);
      }
    };

    void loop();
    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [reduced, inView, pageVisible, count]);

  if (!front) return null;

  const duration = stage === "fly" ? FLY_MS : stage === "drift" ? DRIFT_MS : 0;

  return (
    <div ref={rootRef} className="pointer-events-none w-full">
      <div
        className="relative mx-auto w-full max-w-[22.5rem] pb-5"
        role="img"
        aria-label="Demonstration of passing left and liking right on a garment card."
      >
        <div className="relative aspect-[3/4]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[1.5rem] shadow-[0_22px_40px_-24px_oklch(0.22_0.03_55/0.45)]"
          />
          {behind ? (
            <article
              aria-hidden
              className="absolute inset-0 overflow-hidden rounded-[1.5rem] bg-[oklch(0.93_0.02_75)]"
            >
              <PlateCover plate={behind} />
            </article>
          ) : null}

          <article
            aria-hidden
            className="absolute inset-0 overflow-hidden rounded-[1.5rem] bg-[oklch(0.93_0.02_75)]"
            style={{
              transform: reduced
                ? undefined
                : `translateX(${dx * dir}px) rotate(${(dx * dir) / 22}deg)`,
              transition: moving
                ? `transform ${duration}ms ${EASE}`
                : "none",
              willChange: moving ? "transform" : undefined,
            }}
          >
            <PlateCover plate={front} />
            {!reduced ? (
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: offering
                    ? `oklch(0.52 0.08 145 / ${intent * 0.28})`
                    : `oklch(0.62 0.1 72 / ${intent * 0.28})`,
                }}
              />
            ) : null}
            {!reduced && intent > 0.18 ? (
              <p
                className={`absolute top-5 rounded-[0.55rem] border-2 px-3 py-1 text-[12px] font-semibold tracking-[0.18em] uppercase ${
                  offering
                    ? "right-5 rotate-12 border-[oklch(0.52_0.08_145)] text-[oklch(0.98_0.012_85)]"
                    : "left-5 -rotate-12 border-[oklch(0.62_0.1_72)] text-[oklch(0.98_0.012_85)]"
                }`}
              >
                {offering ? "Like" : "Pass"}
              </p>
            ) : null}
          </article>
        </div>
      </div>

      <div className="pointer-events-none mt-5 flex items-center justify-center gap-4" aria-hidden>
        <GhostRound>
          <RotateCcw size={18} strokeWidth={1.6} />
        </GhostRound>
        <GhostRound>
          <X size={18} strokeWidth={1.7} />
        </GhostRound>
        <GhostRound>
          <Info size={18} strokeWidth={1.6} />
        </GhostRound>
        <GhostRound>
          <Heart size={18} strokeWidth={1.6} />
        </GhostRound>
      </div>
    </div>
  );
}

function PlateCover({ plate }: { plate: PreviewPlate }) {
  return (
    <>
      <img
        src={plate.original_photo_url}
        alt=""
        draggable={false}
        className="size-full object-cover"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] bg-[linear-gradient(to_top,oklch(0.2_0.03_55/0.88),oklch(0.2_0.03_55/0))]" />
      <p className="absolute top-4 left-4 inline-flex max-w-[min(100%-2rem,20rem)] items-center gap-1.5 rounded-full border border-[oklch(0.88_0.02_80/0.55)] bg-[oklch(0.97_0.012_82/0.94)] px-3 py-1.5 text-[12px] leading-4 font-semibold tracking-[0.01em] text-[oklch(0.22_0.025_55)]">
        <MapPin size={12} strokeWidth={1.8} className="shrink-0" />
        <span className="truncate">{plate.location}</span>
      </p>
      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="mb-3 inline-flex items-baseline gap-2 rounded-full bg-[oklch(0.48_0.12_52/0.92)] px-3 py-1.5">
          <span className="text-[14px] font-semibold tabular-nums text-[oklch(0.98_0.012_85)]">
            {formatAed(plate.price)}
          </span>
          {plate.original_retail_price ? (
            <span className="text-[12px] tabular-nums text-[oklch(0.92_0.03_80)] line-through">
              {formatAed(plate.original_retail_price)}
            </span>
          ) : null}
        </div>
        <p className="font-figtree text-[28px] leading-none font-semibold tracking-[-0.03em] text-[oklch(0.98_0.012_85)]">
          {plate.brand}
        </p>
        <p className="mt-2 text-[16px] leading-6 text-[oklch(0.95_0.02_85)]">
          {plate.title}
        </p>
        <p className="mt-1 text-[12px] leading-4 text-[oklch(0.9_0.03_80)]">
          {plate.size}
        </p>
      </div>
    </>
  );
}

function GhostRound({ children }: { children: ReactNode }) {
  return (
    <span className="grid size-12 place-items-center rounded-full border border-[#E5D9C4] bg-[#FDFBF7] text-[oklch(0.22_0.025_55)] lg:size-14">
      {children}
    </span>
  );
}
