"use client";

import { WaitlistForm } from "@/components/web/WaitlistForm";
import { WaitlistQr } from "@/components/web/WaitlistQr";
import { formatAed } from "@/lib/checkout";
import type { PreviewPlate, TeaserDeckData } from "@/lib/listings";
import { formatCountdown, nextSundayDropMs } from "@/lib/next-drop";
import { Heart, Info, RotateCcw, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

const EASE = "cubic-bezier(0.25, 1, 0.5, 1)";
const THRESHOLD = 88;
const EXIT_MS = 340;
const GOLD = "#E5D9C4";

type TeaserDeckProps = {
  deck: TeaserDeckData;
};

export function TeaserDeck({ deck }: TeaserDeckProps) {
  const plates: PreviewPlate[] = [deck.first, deck.second];
  const [index, setIndex] = useState(0);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exit, setExit] = useState<"left" | "right" | null>(null);
  const [gate, setGate] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [inView, setInView] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const startX = useRef(0);
  const pointer = useRef<number | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const remaining = nextSundayDropMs(now) - now;

  const onGate = index >= 2;
  const current = onGate ? null : plates[index];
  const next = index === 0 ? plates[1] : index === 1 || onGate ? "gate" : null;
  const intent = Math.max(-1, Math.min(1, dx / 140));
  const rotating = dragging || Boolean(exit);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) =>
        setInView(entry.isIntersecting && entry.intersectionRatio > 0.35),
      { threshold: [0, 0.35, 1] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const fly = useCallback(
    (direction: "left" | "right") => {
      if (exit || onGate) return;
      if (reduced) {
        const atGate = index >= 1;
        setIndex((value) => value + 1);
        setDx(0);
        if (atGate) setGate(true);
        return;
      }
      setExit(direction);
      setDx(direction === "right" ? 430 : -430);
      window.setTimeout(() => {
        const atGate = index >= 1;
        setIndex((value) => value + 1);
        setDx(0);
        setExit(null);
        setDragging(false);
        if (atGate) setGate(true);
      }, EXIT_MS);
    },
    [exit, index, onGate, reduced],
  );

  const rewind = () => {
    if (exit || index === 0) return;
    setIndex((value) => Math.max(0, value - 1));
    setGate(false);
    setDx(0);
    setExit(null);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (exit || onGate) return;
    pointer.current = event.pointerId;
    startX.current = event.clientX;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (pointer.current !== event.pointerId || exit || onGate) return;
    setDx(event.clientX - startX.current);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (pointer.current !== event.pointerId) return;
    pointer.current = null;
    setDragging(false);
    if (dx > THRESHOLD) fly("right");
    else if (dx < -THRESHOLD) fly("left");
    else setDx(0);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
  };

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    const prevent = (event: TouchEvent) => {
      if (dragging) event.preventDefault();
    };
    node.addEventListener("touchmove", prevent, { passive: false });
    return () => node.removeEventListener("touchmove", prevent);
  }, [dragging]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!inView) return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        fly("left");
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        fly("right");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fly, inView]);

  return (
    <div
      ref={rootRef}
      className="relative flex min-h-0 flex-1 flex-col justify-center px-1 pb-4"
    >
      <div className="relative mx-auto w-full max-w-[22.5rem] pb-5">
        <div className="relative aspect-[3/4]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[1.5rem] shadow-[0_22px_40px_-24px_oklch(0.22_0.03_55/0.45)]"
          />
          {next === "gate" || onGate ? (
            <MysteryCard
              photo={deck.mysteryPhoto}
              countdown={formatCountdown(remaining)}
            />
          ) : next ? (
            <article
              aria-hidden
              className="absolute inset-0 overflow-hidden rounded-[1.5rem] bg-[oklch(0.93_0.02_75)]"
            >
              <PlateCover plate={next} />
            </article>
          ) : null}

          {current ? (
            <article
              ref={cardRef}
              className="absolute inset-0 touch-none overflow-hidden rounded-[1.5rem] bg-[oklch(0.93_0.02_75)]"
              style={{
                transform: `translateX(${dx}px) rotate(${dx / 22}deg)`,
                transition:
                  rotating && !dragging ? `transform ${EXIT_MS}ms ${EASE}` : "none",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <PlateCover plate={current} />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    intent > 0
                      ? `oklch(0.52 0.08 145 / ${Math.abs(intent) * 0.28})`
                      : intent < 0
                        ? `oklch(0.62 0.1 72 / ${Math.abs(intent) * 0.28})`
                        : "transparent",
                }}
              />
              {Math.abs(intent) > 0.18 ? (
                <p
                  className={`absolute top-5 rounded-[0.55rem] border-2 px-3 py-1 text-[12px] font-semibold tracking-[0.18em] uppercase ${
                    intent > 0
                      ? "right-5 rotate-12 border-[oklch(0.52_0.08_145)] text-[oklch(0.98_0.012_85)]"
                      : "left-5 -rotate-12 border-[oklch(0.62_0.1_72)] text-[oklch(0.98_0.012_85)]"
                  }`}
                >
                  {intent > 0 ? "Like" : "Pass"}
                </p>
              ) : null}
            </article>
          ) : null}
        </div>
      </div>

      <div className="mt-1 flex items-center justify-center gap-4">
        <RoundButton label="Backtrack" onClick={rewind} disabled={index === 0}>
          <RotateCcw size={18} strokeWidth={1.6} />
        </RoundButton>
        <RoundButton
          label="Pass"
          onClick={() => fly("left")}
          disabled={onGate}
        >
          <X size={18} strokeWidth={1.7} />
        </RoundButton>
        <RoundButton label="Details" disabled>
          <Info size={18} strokeWidth={1.6} />
        </RoundButton>
        <RoundButton
          label="Like"
          onClick={() => fly("right")}
          disabled={onGate}
        >
          <Heart size={18} strokeWidth={1.6} />
        </RoundButton>
      </div>

      <p className="mt-4 px-1 text-[13px] leading-5 text-[oklch(0.42_0.03_55)]">
        Swipe, tap Pass or Like, or use the arrow keys. Demonstration plates.
      </p>

      {gate ? (
        <div className="absolute inset-x-0 bottom-0 z-30 px-3 pb-3 pt-8">
          <div
            className="max-h-[min(70%,28rem)] overflow-y-auto rounded-[1.35rem] border bg-[#FDFBF7] px-4 py-5 motion-safe:animate-[teaser-drawer_420ms_cubic-bezier(0.25,1,0.5,1)_both]"
            style={{ borderColor: GOLD }}
            role="region"
            aria-label="App waitlist gate"
          >
            <p className="text-[16px] font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
              The real drops happen on the app.
            </p>
            <p className="mt-2 max-w-[34ch] text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
              Join the VIP waitlist. Sunday 8:00 PM GST is the demonstration
              drop time — not a live inventory claim.
            </p>
            <div className="mt-4 hidden lg:block">
              <WaitlistQr />
            </div>
            <div className="mt-4">
              <WaitlistForm variant="drawer" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MysteryCard({
  photo,
  countdown,
}: {
  photo: string;
  countdown: string;
}) {
  return (
    <article className="absolute inset-0 overflow-hidden rounded-[1.5rem] bg-[oklch(0.93_0.02_75)]">
      <img
        src={photo}
        alt=""
        className="size-full object-cover blur-[18px] scale-110"
      />
      <div className="absolute inset-0 bg-[oklch(0.48_0.12_52/0.28)]" />
      <div className="absolute inset-0 grid place-items-center px-6 text-center">
        <div
          className="w-full rounded-[1.25rem] border bg-[oklch(0.97_0.012_82/0.78)] px-5 py-6 backdrop-blur-md"
          style={{ borderColor: GOLD }}
        >
          <LockMark />
          <p className="mt-3 text-[12px] font-semibold tracking-[0.16em] text-[oklch(0.38_0.03_55)] uppercase">
            Next reveal in
          </p>
          <p className="mt-2 font-figtree text-[32px] leading-none font-semibold tracking-[-0.03em] tabular-nums text-[oklch(0.22_0.025_55)]">
            {countdown}
          </p>
        </div>
      </div>
    </article>
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
        {plate.location}
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
        <p className="text-[28px] leading-none font-semibold tracking-[-0.03em] text-[oklch(0.98_0.012_85)]">
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

function RoundButton({
  label,
  onClick,
  children,
  disabled = false,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-12 place-items-center rounded-full border bg-[#FDFBF7] text-[oklch(0.22_0.025_55)] transition-colors duration-200 hover:bg-[oklch(0.96_0.012_82)] disabled:opacity-35 lg:size-14"
      style={{ borderColor: GOLD, transitionTimingFunction: EASE }}
    >
      {children}
    </button>
  );
}

function LockMark() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden
      className="mx-auto text-[oklch(0.48_0.12_52)]"
    >
      <rect
        x="6.5"
        y="12.5"
        width="15"
        height="11"
        rx="2.2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M9.5 12.5V9.6a4.5 4.5 0 0 1 9 0v2.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
