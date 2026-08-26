"use client";

import {
  InPhonePolaroidWell,
  PolaroidCaption,
  PolaroidShell,
} from "@/components/brand/PolaroidShell";
import { TapedPanel } from "@/components/brand/WashiTape";
import { WaitlistForm } from "@/components/web/WaitlistForm";
import { formatAed } from "@/lib/checkout";
import type { PreviewPlate, TeaserDeckData } from "@/lib/listings";
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
  const startX = useRef(0);
  const pointer = useRef<number | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

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
      className="relative flex min-h-0 flex-1 flex-col px-1 pb-3"
    >
      <InPhonePolaroidWell>
          {next === "gate" || onGate ? (
            <MysteryCard photo={deck.mysteryPhoto} />
          ) : next ? (
            <PolaroidShell
              tilt={-1}
              className="absolute inset-0"
              caption={
                <PolaroidCaption
                  title={`${next.brand} ${next.title}`}
                  price={formatAed(next.price)}
                  retail={
                    next.original_retail_price
                      ? formatAed(next.original_retail_price)
                      : undefined
                  }
                />
              }
            >
              <PlateCover plate={next} />
            </PolaroidShell>
          ) : null}

          {current ? (
            <PolaroidShell
              articleRef={cardRef}
              tilt={1}
              className="absolute inset-0 touch-none"
              caption={
                <PolaroidCaption
                  title={`${current.brand} ${current.title}`}
                  price={formatAed(current.price)}
                  retail={
                    current.original_retail_price
                      ? formatAed(current.original_retail_price)
                      : undefined
                  }
                  likes={intent > 0.18 ? "♥ like" : undefined}
                />
              }
              style={{
                transform: `translateX(${dx}px) rotate(${dx / 22 + 1}deg)`,
                transition:
                  rotating && !dragging ? `transform ${EXIT_MS}ms ${EASE}` : "none",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <PlateCover plate={current} />
              {Math.abs(intent) > 0.18 ? (
                <p
                  className={`pointer-events-none absolute top-4 font-[family-name:var(--font-handwritten)] text-[28px] leading-none ${
                    intent > 0
                      ? "right-3 rotate-12 text-[#D8829D]"
                      : "left-3 -rotate-12 text-[#4B6584]"
                  }`}
                >
                  {intent > 0 ? "Like!" : "Pass"}
                </p>
              ) : null}
            </PolaroidShell>
          ) : null}
      </InPhonePolaroidWell>

      <div className="mt-2 flex shrink-0 items-center justify-center gap-3">
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

      <p className="mt-3 shrink-0 px-1 font-[family-name:var(--font-handwritten)] text-[14px] leading-5 text-[#6B4A3A]">
        Swipe, tap Pass or Like, or use the arrow keys. Demonstration plates.
      </p>

      {gate ? (
        <div className="absolute inset-x-0 top-2 bottom-0 z-30 flex min-h-0 flex-col bg-[#F9F6F0]/90 px-2 pb-2 pt-3">
          <TapedPanel
            className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4 motion-safe:animate-[teaser-drawer_420ms_cubic-bezier(0.25,1,0.5,1)_both]"
          >
            <div role="region" aria-label="App waitlist gate">
              <p className="font-[family-name:var(--font-typewriter)] text-[16px] text-[#2A1A14]">
                Join the waitlist
              </p>
              <p className="mt-2 max-w-[34ch] text-[14px] leading-5 text-[#6B4A3A]">
                The live closet is not public yet. Leave your details and we will
                write when it opens.
              </p>
              <div className="mt-3">
                <WaitlistForm variant="drawer" />
              </div>
            </div>
          </TapedPanel>
        </div>
      ) : null}
    </div>
  );
}

function MysteryCard({ photo }: { photo: string }) {
  return (
    <PolaroidShell
      tilt={1.5}
      className="absolute inset-0"
      caption={
        <p className="font-[family-name:var(--font-typewriter)] text-[15px] text-[#2A1A14]">
          Coming soon
        </p>
      }
    >
      <img
        src={photo}
        alt=""
        className="size-full scale-110 object-cover blur-[18px]"
      />
      <div className="absolute inset-0 grid place-items-center bg-[#4B6584]/25 px-6 text-center">
        <div className="w-full border border-[#2A1A14] bg-[#F4EFE6] px-5 py-6 shadow-[3px_3px_0_0_#2A1A14]">
          <LockMark />
          <p className="mt-3 font-[family-name:var(--font-handwritten)] text-[14px] text-[#6B4A3A]">
            Coming soon
          </p>
          <p className="mt-2 font-[family-name:var(--font-typewriter)] text-[18px] leading-7 text-[#2A1A14]">
            Join the waitlist
          </p>
        </div>
      </div>
    </PolaroidShell>
  );
}

function PlateCover({ plate }: { plate: PreviewPlate }) {
  return (
    <>
      <img
        src={plate.original_photo_url}
        alt=""
        draggable={false}
        className="size-full object-cover object-[center_18%]"
      />
      <p className="absolute top-3 left-3 max-w-[min(100%-1.5rem,14rem)] truncate bg-[rgba(241,196,15,0.8)] px-2 py-1 font-[family-name:var(--font-handwritten)] text-[13px] leading-4 text-[#2A1A14] -rotate-2">
        {plate.location}
      </p>
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
      className="grid size-12 place-items-center border border-[#2A1A14] bg-[#F4EFE6] text-[#2A1A14] shadow-[3px_3px_0_0_#2A1A14] transition-colors duration-200 hover:bg-[#E4D5C1] disabled:opacity-35"
      style={{ transitionTimingFunction: EASE }}
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
      className="mx-auto text-[#4B6584]"
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
