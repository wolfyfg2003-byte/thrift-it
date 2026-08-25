"use client";

import { formatAed, quoteCheckout } from "@/lib/checkout";
import { Heart, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

const EASE = "cubic-bezier(0.25, 1, 0.5, 1)";
const GOLD = "#E5D9C4";
const DRIFT_MS = 520;
const FLY_MS = 340;
const DRIFT_PX = 78;
const FLY_PX = 430;
const TARGET = 1000;
const ASKING = 1200;
const FLOOR = Math.ceil(ASKING * 0.8);

type DemoPlate = {
  photo: string;
  brand: string;
  title: string;
  price: number;
  condition: string;
};

const PASS_PLATE: DemoPlate = {
  photo: "/deck/house-of-cb.png",
  brand: "House of CB",
  title: "Structured midi",
  price: 450,
  condition: "Pristine",
};

const LOVE_PLATE: DemoPlate = {
  photo: "/deck/zimmermann-floral.png",
  brand: "Zimmermann",
  title: "Linen dress",
  price: ASKING,
  condition: "Pristine",
};

const CHAT = [
  {
    from: "system" as const,
    text: "Offer of AED 1,000 sent. The seller has 24 hours.",
  },
  {
    from: "you" as const,
    text: "AED 1,000 — still above the 80% floor.",
  },
  {
    from: "seller" as const,
    text: "I’ll take it. Packed tonight. Courier label is yours.",
  },
  {
    from: "system" as const,
    text: "Offer accepted. Pay into escrow.",
  },
];

type Step = "swipe" | "bargain" | "chat" | "checkout" | "timeline" | "inspect";
type BargainPhase = "offer" | "sending";
type SwipeMotion = "hold" | "drift" | "fly";
type InspectPhase = "choose" | "accept";

export function TeaserPipeline() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>("swipe");
  const [card, setCard] = useState(0);
  const [dx, setDx] = useState(0);
  const [motion, setMotion] = useState<SwipeMotion>("hold");
  const [offer, setOffer] = useState(ASKING);
  const [bargainPhase, setBargainPhase] = useState<BargainPhase>("offer");
  const [chatCount, setChatCount] = useState(0);
  const [sellerDecide, setSellerDecide] = useState(false);
  const [sellerAcceptPulse, setSellerAcceptPulse] = useState(false);
  const [payPulse, setPayPulse] = useState(false);
  const [track, setTrack] = useState(0);
  const [inspectPhase, setInspectPhase] = useState<InspectPhase>("choose");
  const [acceptPulse, setAcceptPulse] = useState(false);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [reduced, setReduced] = useState(false);

  const quote = quoteCheckout(TARGET);
  const atFloor = offer <= FLOOR;
  const fillPct =
    ASKING <= FLOOR ? 100 : ((offer - FLOOR) / Math.max(ASKING - FLOOR, 1)) * 100;
  const intent = Math.max(-1, Math.min(1, dx / 140));
  const moving = motion !== "hold";
  const front = card === 0 ? PASS_PLATE : LOVE_PLATE;
  const behind = card === 0 ? LOVE_PLATE : null;

  const snap = () => {
    setStep("swipe");
    setCard(0);
    setDx(0);
    setMotion("hold");
    setOffer(ASKING);
    setBargainPhase("offer");
    setChatCount(0);
    setSellerDecide(false);
    setSellerAcceptPulse(false);
    setPayPulse(false);
    setTrack(0);
    setInspectPhase("choose");
    setAcceptPulse(false);
  };

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
    if (!inView || !pageVisible) {
      snap();
      return;
    }

    let cancelled = false;
    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(window.setTimeout(resolve, reduced ? Math.min(ms, 280) : ms));
      });

    const tweenOffer = async (from: number, to: number, ms: number) => {
      if (reduced) {
        setOffer(to);
        return;
      }
      const started = performance.now();
      while (!cancelled) {
        const t = Math.min(1, (performance.now() - started) / ms);
        const eased = 1 - (1 - t) ** 4;
        setOffer(Math.round(from + (to - from) * eased));
        if (t >= 1) break;
        await wait(16);
      }
    };

    const swipe = async (dir: -1 | 1) => {
      setMotion("drift");
      setDx(DRIFT_PX * dir);
      await wait(DRIFT_MS);
      if (cancelled) return;
      setMotion("fly");
      setDx(FLY_PX * dir);
      await wait(FLY_MS);
    };

    const play = async () => {
      while (!cancelled) {
        snap();
        await wait(1400);
        if (cancelled) return;

        await swipe(-1);
        if (cancelled) return;
        setDx(0);
        setMotion("hold");
        setCard(1);
        await wait(1400);
        if (cancelled) return;

        await swipe(1);
        if (cancelled) return;
        setDx(0);
        setMotion("hold");
        setStep("bargain");
        setBargainPhase("offer");
        setOffer(ASKING);
        await wait(800);
        if (cancelled) return;

        await tweenOffer(ASKING, FLOOR, 1100);
        if (cancelled) return;
        await wait(800);
        if (cancelled) return;
        await tweenOffer(FLOOR, TARGET, 480);
        if (cancelled) return;
        await wait(450);
        if (cancelled) return;

        setBargainPhase("sending");
        await wait(900);
        if (cancelled) return;

        setStep("chat");
        setChatCount(1);
        await wait(900);
        if (cancelled) return;
        setChatCount(2);
        await wait(1100);
        if (cancelled) return;
        setSellerDecide(true);
        await wait(1400);
        if (cancelled) return;
        setSellerAcceptPulse(true);
        await wait(700);
        if (cancelled) return;
        setSellerDecide(false);
        setSellerAcceptPulse(false);
        setChatCount(3);
        await wait(1200);
        if (cancelled) return;
        setChatCount(4);
        await wait(1400);
        if (cancelled) return;

        setStep("checkout");
        setPayPulse(false);
        await wait(2200);
        if (cancelled) return;
        setPayPulse(true);
        await wait(700);
        if (cancelled) return;

        setStep("timeline");
        setTrack(0);
        await wait(650);
        if (cancelled) return;
        setTrack(1);
        await wait(650);
        if (cancelled) return;
        setTrack(2);
        await wait(800);
        if (cancelled) return;
        setTrack(3);
        await wait(700);
        if (cancelled) return;

        setStep("inspect");
        setInspectPhase("choose");
        setAcceptPulse(false);
        await wait(2400);
        if (cancelled) return;
        setAcceptPulse(true);
        await wait(800);
        if (cancelled) return;
        setInspectPhase("accept");
        await wait(2000);
        if (cancelled) return;
      }
    };

    void play();
    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [inView, pageVisible, reduced]);

  return (
    <div
      ref={rootRef}
      className="pointer-events-none relative flex min-h-0 flex-1 flex-col overflow-hidden px-1 pb-3"
      role="img"
      aria-label="Demonstration of a Thrift It sale: pass left, love right, offer in chat, pay into escrow, then accept or reject on delivery."
    >
      {step === "swipe" ? (
        <SwipeStage
          front={front}
          behind={behind}
          dx={dx}
          moving={moving}
          intent={intent}
        />
      ) : null}
      {step === "bargain" ? (
        <BargainStage
          offer={offer}
          atFloor={atFloor}
          fillPct={fillPct}
          phase={bargainPhase}
        />
      ) : null}
      {step === "chat" ? (
        <ChatStage
          count={chatCount}
          decide={sellerDecide}
          acceptPulse={sellerAcceptPulse}
        />
      ) : null}
      {step === "checkout" ? <CheckoutStage quote={quote} pulse={payPulse} /> : null}
      {step === "timeline" ? <TimelineStage track={track} /> : null}
      {step === "inspect" ? (
        <InspectStage
          phase={inspectPhase}
          pulse={acceptPulse}
          held={quote.total_charge}
        />
      ) : null}
    </div>
  );
}

function SwipeStage({
  front,
  behind,
  dx,
  moving,
  intent,
}: {
  front: DemoPlate;
  behind: DemoPlate | null;
  dx: number;
  moving: boolean;
  intent: number;
}) {
  const passing = intent < 0;
  const loving = intent > 0;
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center">
      <div className="relative mx-auto w-full max-w-[22.5rem]">
        <div className="relative aspect-[3/4]">
          <div
            aria-hidden
            className="absolute inset-0 rounded-[1.5rem] shadow-[0_22px_40px_-24px_oklch(0.22_0.03_55/0.45)]"
          />
          {behind ? (
            <article
              aria-hidden
              className="absolute inset-0 overflow-hidden rounded-[1.5rem] bg-[oklch(0.93_0.02_75)]"
            >
              <GarmentCover plate={behind} />
            </article>
          ) : null}
          <article
            aria-hidden
            className="absolute inset-0 overflow-hidden rounded-[1.5rem] bg-[oklch(0.93_0.02_75)]"
            style={{
              transform: `translateX(${dx}px) rotate(${dx / 22}deg)`,
              transition: moving ? `transform ${motionMs(dx)}ms ${EASE}` : "none",
            }}
          >
            <GarmentCover plate={front} />
            <div
              className="absolute inset-0"
              style={{
                background: loving
                  ? `oklch(0.52 0.08 145 / ${Math.abs(intent) * 0.28})`
                  : passing
                    ? `oklch(0.62 0.1 72 / ${Math.abs(intent) * 0.28})`
                    : "transparent",
              }}
            />
            {Math.abs(intent) > 0.18 ? (
              <p
                className={`absolute top-5 rounded-[0.55rem] border-2 px-3 py-1 text-[12px] font-semibold tracking-[0.18em] uppercase ${
                  loving
                    ? "right-5 rotate-12 border-[oklch(0.52_0.08_145)] text-[oklch(0.98_0.012_85)]"
                    : "left-5 -rotate-12 border-[oklch(0.62_0.1_72)] text-[oklch(0.98_0.012_85)]"
                }`}
              >
                {loving ? "Love" : "Pass"}
              </p>
            ) : null}
          </article>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-5" aria-hidden>
        <GhostRound active={passing}>
          <X size={18} strokeWidth={1.7} />
        </GhostRound>
        <GhostRound active={loving}>
          <Heart size={18} strokeWidth={1.6} />
        </GhostRound>
      </div>
      <p className="mt-3 px-1 text-center text-[13px] leading-5 text-[oklch(0.42_0.03_55)]">
        Pass left, love right. Demonstration loop.
      </p>
    </div>
  );
}

function motionMs(dx: number) {
  return Math.abs(dx) >= FLY_PX - 1 ? FLY_MS : DRIFT_MS;
}

function BargainStage({
  offer,
  atFloor,
  fillPct,
  phase,
}: {
  offer: number;
  atFloor: boolean;
  fillPct: number;
  phase: BargainPhase;
}) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[1.25rem]">
        <img src={LOVE_PLATE.photo} alt="" className="size-full object-cover" />
        <div className="absolute inset-0 bg-[oklch(0.2_0.03_55/0.28)]" />
      </div>
      <p
        className="absolute top-1 right-1 left-1 z-10 flex items-center gap-2 rounded-full border bg-[#FDFBF7] px-3 py-2 text-[12px] leading-4 font-semibold text-[oklch(0.22_0.025_55)] motion-safe:animate-[teaser-match_420ms_cubic-bezier(0.25,1,0.5,1)_both]"
        style={{ borderColor: GOLD }}
      >
        <MatchMark />
        Match. The seller is online.
      </p>
      <div
        className="absolute inset-x-0 bottom-0 z-10 rounded-t-[1.35rem] border bg-[oklch(0.97_0.012_82)] px-4 pt-5 pb-4 motion-safe:animate-[teaser-drawer_420ms_cubic-bezier(0.25,1,0.5,1)_both]"
        style={{ borderColor: GOLD }}
      >
        {phase === "sending" ? (
          <div className="grid place-items-center py-8">
            <span className="size-8 rounded-full border-2 border-[oklch(0.88_0.018_80)] border-t-[oklch(0.48_0.12_52)] motion-safe:animate-[teaser-spin_700ms_linear_infinite]" />
            <p className="mt-4 text-[14px] text-[oklch(0.42_0.03_55)]">
              Opening seller chat…
            </p>
          </div>
        ) : (
          <>
            <p className="font-figtree text-[16px] font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
              Make an Offer
            </p>
            <p className="mt-1 text-[13px] text-[oklch(0.42_0.03_55)]">
              {LOVE_PLATE.brand} {LOVE_PLATE.title} · asking {formatAed(ASKING)}
            </p>
            <p className="mt-4 font-figtree text-[32px] leading-none font-semibold tracking-[-0.03em] tabular-nums text-[oklch(0.22_0.025_55)]">
              {formatAed(offer)}
            </p>
            <div className="mt-5">
              <div className="mb-2 flex items-end justify-between text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
                <span className="tabular-nums">{formatAed(FLOOR)}</span>
                <span className="text-[14px] text-[oklch(0.22_0.025_55)]">
                  Your offer
                </span>
                <span className="tabular-nums">{formatAed(ASKING)}</span>
              </div>
              <div
                className="relative h-8 w-full"
                style={{
                  background: `linear-gradient(to right, oklch(0.48 0.12 52) 0%, oklch(0.48 0.12 52) ${fillPct}%, oklch(0.88 0.02 72) ${fillPct}%, oklch(0.88 0.02 72) 100%)`,
                  backgroundSize: "100% 6px",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                <span
                  className="absolute top-[5px] size-6 rounded-full border-2 border-[#FDFBF7] bg-[oklch(0.48_0.12_52)]"
                  style={{ left: `${fillPct}%`, transform: "translateX(-50%)" }}
                />
              </div>
              {atFloor ? (
                <p
                  className="mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] text-[oklch(0.48_0.12_52)]"
                  style={{ borderColor: GOLD }}
                >
                  Thrift It Protection Floor
                </p>
              ) : (
                <p className="mt-2 text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
                  Offers cannot drop below 80% of asking.
                </p>
              )}
            </div>
            <div className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-[oklch(0.22_0.025_55)] text-[14px] font-semibold tracking-[-0.01em] text-[#FDFBF7]">
              Submit Offer
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ChatStage({
  count,
  decide,
  acceptPulse,
}: {
  count: number;
  decide: boolean;
  acceptPulse: boolean;
}) {
  const visible = CHAT.slice(0, count);
  return (
    <div className="flex min-h-0 flex-1 flex-col px-1 pt-1">
      <p className="font-figtree text-[16px] font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
        Chat with @amna-m
      </p>
      <p className="mt-1 text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
        {LOVE_PLATE.brand} {LOVE_PLATE.title} · demonstration thread
      </p>
      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2.5">
        {visible.map((line) => (
          <ChatBubble key={line.text} from={line.from} text={line.text} />
        ))}
      </div>
      {decide ? (
        <div className="mt-3 grid grid-cols-3 gap-1.5 pb-1">
          {["Decline", "Counter", "Accept"].map((label) => {
            const primary = label === "Accept";
            return (
              <div
                key={label}
                className={`flex h-10 items-center justify-center rounded-full text-[12px] font-semibold tracking-[-0.01em] ${
                  primary
                    ? "bg-[oklch(0.22_0.025_55)] text-[#FDFBF7]"
                    : "border text-[oklch(0.22_0.025_55)]"
                }`}
                style={{
                  borderColor: primary ? undefined : GOLD,
                  color: primary && acceptPulse ? "oklch(0.82 0.1 78)" : undefined,
                  transition: `color 300ms ${EASE}`,
                }}
              >
                {label}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function ChatBubble({
  from,
  text,
}: {
  from: "system" | "you" | "seller";
  text: string;
}) {
  if (from === "system") {
    return (
      <p className="self-center rounded-full bg-[oklch(0.96_0.012_82)] px-3 py-1.5 text-center text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
        {text}
      </p>
    );
  }
  const mine = from === "you";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <p
        className={`max-w-[85%] rounded-[1.1rem] px-3.5 py-2.5 text-[14px] leading-5 ${
          mine
            ? "rounded-br-sm bg-[oklch(0.22_0.025_55)] text-[oklch(0.98_0.012_85)]"
            : "rounded-bl-sm border bg-[oklch(0.97_0.012_82)] text-[oklch(0.22_0.025_55)]"
        }`}
        style={mine ? undefined : { borderColor: GOLD }}
      >
        {text}
      </p>
    </div>
  );
}

function CheckoutStage({
  quote,
  pulse,
}: {
  quote: ReturnType<typeof quoteCheckout>;
  pulse: boolean;
}) {
  const rows = [
    { label: "Accepted offer", value: formatAed(quote.item_price) },
    {
      label: "Buyer protection (20%)",
      value: formatAed(quote.buyer_protection_fee),
    },
    { label: "Flat courier fee", value: formatAed(quote.shipping_fee) },
  ] as const;

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-between px-1 pt-2 pb-1">
      <div>
        <p className="font-figtree text-[20px] leading-7 font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
          Checkout
        </p>
        <p className="mt-2 text-[13px] leading-5 text-[oklch(0.42_0.03_55)]">
          {LOVE_PLATE.brand} {LOVE_PLATE.title} · demonstration quote
        </p>
        <dl className="mt-6">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-4 border-b py-3.5"
              style={{ borderColor: GOLD }}
            >
              <dt className="text-[14px] leading-6 text-[oklch(0.42_0.03_55)]">
                {row.label}
              </dt>
              <dd className="text-[14px] leading-6 font-semibold tabular-nums text-[oklch(0.22_0.025_55)]">
                {row.value}
              </dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between gap-4 pt-4">
            <dt className="text-[16px] leading-7 font-semibold text-[oklch(0.22_0.025_55)]">
              Total payable
            </dt>
            <dd className="font-figtree text-[20px] leading-7 font-semibold tabular-nums text-[oklch(0.22_0.025_55)]">
              {formatAed(quote.total_charge)}
            </dd>
          </div>
        </dl>
      </div>
      <div
        className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[oklch(0.22_0.025_55)] text-[14px] font-semibold tracking-[-0.01em] text-[#FDFBF7] transition-colors duration-300"
        style={{
          transitionTimingFunction: EASE,
          color: pulse ? "oklch(0.82 0.1 78)" : undefined,
        }}
      >
        Pay into escrow
      </div>
    </div>
  );
}

function TimelineStage({ track }: { track: number }) {
  const stops = [
    "Label created",
    "In transit",
    "Delivered",
    "48-hour inspection",
  ] as const;

  return (
    <div className="flex min-h-0 flex-1 flex-col px-1 pt-2">
      <p className="font-figtree text-[20px] leading-7 font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
        Escrow timeline
      </p>
      <p className="mt-2 text-[13px] leading-5 text-[oklch(0.42_0.03_55)]">
        Escrow holds the funds. Courier is on the way.
      </p>
      <ol className="mt-6 flex flex-col">
        {stops.map((label, index) => {
          const active = index <= track;
          return (
            <li key={label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`mt-0.5 size-2.5 rounded-full transition-colors duration-300 ${
                    active
                      ? "bg-[oklch(0.48_0.12_52)]"
                      : "bg-[oklch(0.88_0.018_80)]"
                  }`}
                  style={{ transitionTimingFunction: EASE }}
                />
                {index < stops.length - 1 ? (
                  <span
                    className="my-1 w-px min-h-7 flex-1"
                    style={{ background: GOLD }}
                  />
                ) : null}
              </div>
              <p
                className={`pb-4 text-[14px] leading-5 transition-colors duration-300 ${
                  active
                    ? "font-semibold text-[oklch(0.22_0.025_55)]"
                    : "text-[oklch(0.5_0.02_55)]"
                }`}
                style={{ transitionTimingFunction: EASE }}
              >
                {label}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function InspectStage({
  phase,
  pulse,
  held,
}: {
  phase: InspectPhase;
  pulse: boolean;
  held: number;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-between px-1 pt-2 pb-1">
      <div>
        <p className="font-figtree text-[20px] leading-7 font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
          48-hour inspection
        </p>
        <p className="mt-3 max-w-[34ch] text-[14px] leading-6 text-[oklch(0.42_0.03_55)]">
          Delivered. Escrow still holds the money. The buyer must Accept item
          to release payout, or Reject & dispute to freeze it.
        </p>
        <p
          className="mt-4 inline-flex rounded-full border px-3 py-1.5 text-[12px] font-semibold tracking-[0.04em] text-[oklch(0.48_0.12_52)]"
          style={{ borderColor: GOLD }}
        >
          Escrow held · {formatAed(held)}
        </p>
      </div>
      {phase === "accept" ? (
        <div className="rounded-[1.25rem] border bg-[oklch(0.97_0.012_82)] px-4 py-5" style={{ borderColor: GOLD }}>
          <CheckMark />
          <p className="mt-3 font-figtree text-[16px] font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
            Item accepted
          </p>
          <p className="mt-2 text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
            Escrow released to the seller. A rejection would have frozen payout
            and opened a dispute.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          <div
            className="flex h-12 items-center justify-center rounded-full border text-[14px] font-semibold text-[oklch(0.22_0.025_55)]"
            style={{ borderColor: GOLD }}
          >
            Reject & dispute
          </div>
          <div
            className="flex h-12 items-center justify-center rounded-full bg-[oklch(0.22_0.025_55)] text-[14px] font-semibold tracking-[-0.01em] text-[#FDFBF7] transition-colors duration-300"
            style={{
              transitionTimingFunction: EASE,
              color: pulse ? "oklch(0.82 0.1 78)" : undefined,
            }}
          >
            Accept item
          </div>
        </div>
      )}
    </div>
  );
}

function GarmentCover({ plate }: { plate: DemoPlate }) {
  return (
    <>
      <img src={plate.photo} alt="" draggable={false} className="size-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 h-[48%] bg-[linear-gradient(to_top,oklch(0.2_0.03_55/0.88),oklch(0.2_0.03_55/0))]" />
      <p className="absolute top-4 left-4 rounded-full border border-[oklch(0.88_0.02_80/0.55)] bg-[oklch(0.97_0.012_82/0.94)] px-3 py-1.5 text-[12px] font-semibold text-[oklch(0.22_0.025_55)]">
        {plate.condition}
      </p>
      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="mb-3 inline-flex rounded-full bg-[oklch(0.48_0.12_52/0.92)] px-3 py-1.5">
          <span className="text-[14px] font-semibold tabular-nums text-[oklch(0.98_0.012_85)]">
            {formatAed(plate.price)}
          </span>
        </div>
        <p className="font-figtree text-[28px] leading-none font-semibold tracking-[-0.03em] text-[oklch(0.98_0.012_85)]">
          {plate.brand}
        </p>
        <p className="mt-2 text-[16px] leading-6 text-[oklch(0.95_0.02_85)]">
          {plate.title}
        </p>
      </div>
    </>
  );
}

function GhostRound({
  children,
  active = false,
}: {
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={`grid size-14 place-items-center rounded-full border bg-[#FDFBF7] text-[oklch(0.22_0.025_55)] transition-colors duration-300 ${
        active ? "border-[oklch(0.48_0.12_52)]" : ""
      }`}
      style={{
        borderColor: active ? undefined : GOLD,
        transitionTimingFunction: EASE,
      }}
    >
      {children}
    </span>
  );
}

function MatchMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="shrink-0 text-[oklch(0.48_0.12_52)]">
      <circle cx="7" cy="7" r="5.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4.4 7.1 6.2 8.8 9.6 5.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden className="text-[oklch(0.48_0.12_52)]">
      <circle cx="18" cy="18" r="14.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M11.5 18.2 16 22.5 24.5 13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
