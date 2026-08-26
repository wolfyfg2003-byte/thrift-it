"use client";

import { PolaroidCaption, PolaroidShell } from "@/components/brand/PolaroidShell";
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
        <div className="relative aspect-[3/4.25]">
          {behind ? (
            <PolaroidShell
              tilt={-1}
              className="absolute inset-0"
              caption={
                <PolaroidCaption
                  title={`${behind.brand} ${behind.title}`}
                  price={formatAed(behind.price)}
                />
              }
            >
              <PlateCover plate={behind} />
            </PolaroidShell>
          ) : null}

          <PolaroidShell
            tilt={1}
            className="absolute inset-0"
            caption={
              <PolaroidCaption
                title={`${front.brand} ${front.title}`}
                price={formatAed(front.price)}
                likes={offering && intent > 0.18 ? "♥ like" : undefined}
              />
            }
            style={{
              transform: reduced
                ? undefined
                : `translateX(${dx * dir}px) rotate(${(dx * dir) / 22 + 1}deg)`,
              transition: moving
                ? `transform ${duration}ms ${EASE}`
                : "none",
              willChange: moving ? "transform" : undefined,
            }}
          >
            <PlateCover plate={front} />
            {!reduced && intent > 0.18 ? (
              <p
                className={`pointer-events-none absolute top-4 font-[family-name:var(--font-handwritten)] text-[28px] leading-none ${
                  offering
                    ? "right-3 rotate-12 text-[#D8829D]"
                    : "left-3 -rotate-12 text-[#4B6584]"
                }`}
              >
                {offering ? "Like!" : "Pass"}
              </p>
            ) : null}
          </PolaroidShell>
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
      <p className="absolute top-3 left-3 inline-flex max-w-[min(100%-1.5rem,14rem)] items-center gap-1 bg-[rgba(241,196,15,0.8)] px-2 py-1 font-[family-name:var(--font-handwritten)] text-[13px] leading-4 text-[#2A1A14] -rotate-2">
        <MapPin size={12} strokeWidth={1.8} className="shrink-0" />
        <span className="truncate">{plate.location}</span>
      </p>
    </>
  );
}

function GhostRound({ children }: { children: ReactNode }) {
  return (
    <span className="grid size-12 place-items-center border border-[#2A1A14] bg-[#F4EFE6] text-[#2A1A14] shadow-[3px_3px_0_0_#2A1A14] lg:size-14">
      {children}
    </span>
  );
}
