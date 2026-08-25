"use client";

import { formatAed } from "@/lib/checkout";
import { counterpart, type ChatMessage, type ChatThread } from "@/lib/chats";
import {
  restoreListingSales,
  syncListingSaleFromServer,
  useThreadClosed,
} from "@/lib/listing-sale-store";
import type { Listing } from "@/lib/listings";
import {
  getOfferFloor,
  isOfferAtOrAboveFloor,
  OFFER_EXPIRY_HOURS,
  OFFER_FLOOR_ERROR,
} from "@/lib/offers";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const EXPIRY_MS = OFFER_EXPIRY_HOURS * 60 * 60 * 1000;

type OfferPhase = "pending" | "counter" | "accepted" | "expired" | "shipped";

export default function ChatScreen({
  chat,
  listing,
}: {
  chat: ChatThread;
  listing: Listing;
}) {
  const asking = listing.price;
  const floor = getOfferFloor(asking);
  const person = counterpart(chat);
  const [messages, setMessages] = useState<ChatMessage[]>(chat.messages);
  const [draft, setDraft] = useState("");
  const [offer, setOffer] = useState(chat.offerAmount);
  const [phase, setPhase] = useState<OfferPhase>(() => {
    if (chat.status === "shipped") return "shipped";
    if (chat.status === "accepted") return "accepted";
    return "pending";
  });
  const [counterDraft, setCounterDraft] = useState(chat.offerAmount);
  const [counterError, setCounterError] = useState<string | null>(null);
  const [expiresAt] = useState(() => Date.now() + EXPIRY_MS);
  const [now, setNow] = useState(() => Date.now());
  const [viewportH, setViewportH] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const closed = useThreadClosed(listing.id, chat.id);

  const remaining = Math.max(0, expiresAt - now);

  useEffect(() => {
    restoreListingSales();
    void syncListingSaleFromServer(listing.id);
  }, [listing.id]);

  useEffect(() => {
    const vv = window.visualViewport;
    const sync = () => setViewportH(vv?.height ?? window.innerHeight);
    sync();
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  useEffect(() => {
    if (closed || phase === "accepted" || phase === "shipped") return;
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, [closed, phase]);

  useEffect(() => {
    if (closed || phase === "accepted" || phase === "shipped" || phase === "expired") return;
    if (remaining <= 0) setPhase("expired");
  }, [closed, phase, remaining]);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, phase, closed]);

  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (closed) return;
    const text = draft.trim();
    if (!text) return;
    setMessages((current) => [
      ...current,
      {
        id: `local-${current.length + 1}`,
        from: chat.viewer,
        text,
        time: "Now",
      },
    ]);
    setDraft("");
  };

  const sendCounter = () => {
    if (closed) return;
    if (!isOfferAtOrAboveFloor(counterDraft, asking) || counterDraft > asking) {
      setCounterError(OFFER_FLOOR_ERROR);
      return;
    }
    setOffer(counterDraft);
    setCounterError(null);
    setPhase("pending");
    setMessages((current) => [
      ...current,
      {
        id: `counter-${current.length + 1}`,
        from: chat.viewer,
        text: `Counter at ${formatAed(counterDraft)}. 24 hours to accept, then pay into escrow.`,
        time: "Now",
      },
    ]);
  };

  return (
    <div
      className="mx-auto flex w-full max-w-[28rem] flex-col overflow-hidden bg-[#FDFBF7]"
      style={{ height: viewportH ?? "100dvh" }}
    >
      <header className="shrink-0 border-b border-[oklch(0.88_0.018_80)] bg-[#FDFBF7] px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <div className="flex items-center gap-2">
          <Link
            href="/chats"
            aria-label="Back to inbox"
            className="grid size-10 shrink-0 place-items-center text-[oklch(0.22_0.025_55)]"
          >
            <BackIcon />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-[20px] leading-7 font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
                {person.handle}
              </h1>
              {closed ? (
                <span className="shrink-0 rounded-full bg-[oklch(0.92_0.016_70)] px-2.5 py-[3px] text-[12px] leading-4 text-[oklch(0.36_0.04_50)]">
                  Sold Out
                </span>
              ) : null}
            </div>
            <p className="truncate text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
              {person.responseRate}
            </p>
          </div>
        </div>

        <article className="mt-3 flex items-center gap-3 rounded-[1.1rem] bg-[oklch(0.96_0.01_82)] p-2 pr-3">
          {listing.original_photo_url ? (
            <img
              src={listing.original_photo_url}
              alt=""
              className="size-14 shrink-0 rounded-[0.8rem] border border-[oklch(0.88_0.018_80)] object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="grid size-14 shrink-0 place-items-center rounded-[0.8rem] border border-[oklch(0.88_0.018_80)] bg-[oklch(0.93_0.02_75)] font-[family-name:var(--font-bodoni)] text-[16px] text-[oklch(0.38_0.05_52)]"
            >
              {listing.brand.slice(0, 1)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
              {listing.brand}
            </p>
            <p className="truncate text-[16px] leading-6 font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
              {listing.title}
            </p>
          </div>
          <p className="shrink-0 text-[14px] leading-5 tabular-nums text-[oklch(0.22_0.025_55)]">
            {formatAed(asking)}
          </p>
        </article>
      </header>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-4">
        <p className="mb-5 text-center text-[12px] leading-4 text-[oklch(0.5_0.025_55)]">
          Demonstration thread — not a live {chat.viewer === "buyer" ? "seller" : "buyer"}.
        </p>

        <ol className="flex flex-col gap-3">
          {messages.map((message) => {
            const mine = message.from === chat.viewer;
            return (
              <li
                key={message.id}
                className={`max-w-[17.5rem] px-3.5 py-2.5 text-[16px] leading-6 ${
                  mine
                    ? "self-end rounded-[1.15rem_1.15rem_0.35rem_1.15rem] bg-[oklch(0.93_0.018_72)] text-[oklch(0.22_0.025_55)]"
                    : "self-start rounded-[1.15rem_1.15rem_1.15rem_0.35rem] bg-[oklch(0.96_0.01_82)] text-[oklch(0.22_0.025_55)]"
                }`}
              >
                <p>{message.text}</p>
                <p className="mt-1 text-[12px] leading-4 text-[oklch(0.45_0.03_55)]">
                  {message.time}
                </p>
              </li>
            );
          })}
        </ol>

        <OfferCard
          listing={listing}
          chatId={chat.id}
          asking={asking}
          offer={offer}
          remaining={remaining}
          phase={phase}
          floor={floor}
          viewer={chat.viewer}
          counterpartHandle={person.handle}
          counterDraft={counterDraft}
          counterError={counterError}
          disabled={closed}
          onAccept={() => {
            if (closed) return;
            setPhase("accepted");
          }}
          onCounter={() => {
            if (closed) return;
            setCounterDraft(Math.min(asking, Math.max(offer, floor)));
            setPhase("counter");
          }}
          onCounterDraft={setCounterDraft}
          onSendCounter={sendCounter}
          onCancelCounter={() => {
            setPhase("pending");
            setCounterError(null);
          }}
        />

        {closed ? <MissedOutNotice brand={listing.brand} /> : null}
      </div>

      <form
        onSubmit={send}
        className="shrink-0 border-t border-[oklch(0.88_0.018_80)] bg-[#FDFBF7] px-4 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex gap-2">
          <label htmlFor="composer" className="sr-only">
            Message
          </label>
          <input
            id="composer"
            value={closed ? "" : draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={closed ? "This chat is closed" : `Message ${person.handle}`}
            enterKeyHint="send"
            autoComplete="off"
            disabled={closed}
            aria-disabled={closed}
            className="h-12 min-w-0 flex-1 rounded-full border border-[oklch(0.88_0.018_80)] bg-[#FDFBF7] px-4 text-[16px] text-[oklch(0.22_0.025_55)] outline-none placeholder:text-[oklch(0.5_0.025_55)] focus:border-[oklch(0.48_0.12_52)] disabled:cursor-not-allowed disabled:bg-[oklch(0.94_0.01_80)] disabled:text-[oklch(0.55_0.02_55)] disabled:placeholder:text-[oklch(0.58_0.02_55)]"
          />
          <button
            type="submit"
            disabled={closed || !draft.trim()}
            className="h-12 rounded-full bg-[oklch(0.48_0.12_52)] px-4 text-[14px] font-semibold text-[oklch(0.98_0.012_85)] transition-colors duration-200 hover:bg-[oklch(0.42_0.12_52)] disabled:bg-[oklch(0.82_0.02_72)] disabled:text-[oklch(0.5_0.02_55)]"
            style={{ transitionTimingFunction: EASE }}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

function OfferCard({
  listing,
  chatId,
  asking,
  offer,
  remaining,
  phase,
  floor,
  viewer,
  counterpartHandle,
  counterDraft,
  counterError,
  disabled,
  onAccept,
  onCounter,
  onCounterDraft,
  onSendCounter,
  onCancelCounter,
}: {
  listing: Listing;
  chatId: string;
  asking: number;
  offer: number;
  remaining: number;
  phase: OfferPhase;
  floor: number;
  viewer: ChatThread["viewer"];
  counterpartHandle: string;
  counterDraft: number;
  counterError: string | null;
  disabled: boolean;
  onAccept: () => void;
  onCounter: () => void;
  onCounterDraft: (value: number) => void;
  onSendCounter: () => void;
  onCancelCounter: () => void;
}) {
  const fillPct =
    asking === floor ? 100 : ((counterDraft - floor) / (asking - floor)) * 100;
  const checkoutHref = `/checkout/${listing.id}?offer=${offer}&chat=${chatId}`;

  return (
    <article
      aria-disabled={disabled}
      className={`mt-5 rounded-[1.35rem] bg-[oklch(0.96_0.01_82)] px-4 py-4 transition-[filter,opacity] duration-300 ${
        disabled
          ? "pointer-events-none opacity-45 grayscale"
          : ""
      }`}
      style={{ transitionTimingFunction: EASE }}
    >
      <p className="text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
        {listing.brand} · listed {formatAed(asking)}
      </p>
      <p className="mt-2 font-[family-name:var(--font-bodoni)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.22_0.025_55)] tabular-nums">
        Proposed: {formatAed(offer)}
      </p>

      {phase !== "accepted" && phase !== "shipped" ? (
        <CountdownClock remaining={remaining} />
      ) : null}

      {phase === "pending" ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCounter}
            disabled={disabled}
            className="h-11 rounded-full border border-[oklch(0.84_0.02_75)] bg-[#FDFBF7] text-[14px] font-semibold text-[oklch(0.22_0.025_55)] transition-colors duration-200 hover:bg-[oklch(0.93_0.016_80)] disabled:text-[oklch(0.5_0.02_55)]"
            style={{ transitionTimingFunction: EASE }}
          >
            Counter
          </button>
          <button
            type="button"
            onClick={onAccept}
            disabled={disabled}
            className="h-11 rounded-full bg-[oklch(0.48_0.12_52)] text-[14px] font-semibold text-[oklch(0.98_0.012_85)] transition-colors duration-200 hover:bg-[oklch(0.42_0.12_52)] disabled:bg-[oklch(0.82_0.02_72)] disabled:text-[oklch(0.5_0.02_55)]"
            style={{ transitionTimingFunction: EASE }}
          >
            Accept
          </button>
        </div>
      ) : null}

      {phase === "counter" ? (
        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="counter-slider" className="text-[14px] leading-5 text-[oklch(0.22_0.025_55)]">
              Counter
            </label>
            <span className="text-[16px] font-semibold tabular-nums text-[oklch(0.22_0.025_55)]">
              {formatAed(counterDraft)}
            </span>
          </div>
          <input
            id="counter-slider"
            type="range"
            min={floor}
            max={asking}
            step={1}
            value={counterDraft}
            aria-valuemin={floor}
            aria-valuemax={asking}
            aria-valuenow={counterDraft}
            aria-valuetext={formatAed(counterDraft)}
            onChange={(event) => onCounterDraft(Number(event.target.value))}
            disabled={disabled}
            className="mt-3 h-8 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[oklch(0.965_0.012_78)] [&::-moz-range-thumb]:bg-[oklch(0.48_0.12_52)] [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:-mt-[9px] [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[oklch(0.965_0.012_78)] [&::-webkit-slider-thumb]:bg-[oklch(0.48_0.12_52)]"
            style={{
              background: `linear-gradient(to right, oklch(0.48 0.12 52) 0%, oklch(0.48 0.12 52) ${fillPct}%, oklch(0.88 0.02 72) ${fillPct}%, oklch(0.88 0.02 72) 100%)`,
              backgroundSize: "100% 6px",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
          <p className="mt-2 text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
            Floor {formatAed(floor)} · listed {formatAed(asking)}
          </p>
          {counterError ? (
            <p role="alert" className="mt-2 text-[14px] leading-5 text-[oklch(0.42_0.1_40)]">
              {counterError}
            </p>
          ) : null}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onCancelCounter}
              disabled={disabled}
              className="h-11 rounded-full border border-[oklch(0.84_0.02_75)] text-[14px] font-semibold text-[oklch(0.22_0.025_55)]"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onSendCounter}
              disabled={disabled}
              className="h-11 rounded-full bg-[oklch(0.48_0.12_52)] text-[14px] font-semibold text-[oklch(0.98_0.012_85)]"
            >
              Send counter
            </button>
          </div>
        </div>
      ) : null}

      {phase === "accepted" ? (
        <div className="mt-4">
          {viewer === "buyer" ? (
            <Link
              href={checkoutHref}
              className="flex min-h-12 items-center justify-center rounded-full bg-[oklch(0.48_0.12_52)] px-4 py-3 text-center text-[14px] font-semibold leading-5 text-[oklch(0.98_0.012_85)] transition-colors duration-200 hover:bg-[oklch(0.42_0.12_52)]"
              style={{ transitionTimingFunction: EASE }}
            >
              Offer Accepted! Complete Secure Escrow Payment of {formatAed(offer)}
            </Link>
          ) : (
            <div>
              <p className="max-w-[40ch] text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
                Offer accepted. {counterpartHandle} has 24 hours to pay into Mamo Pay
                escrow before the listing returns to active.
              </p>
              <Link
                href={checkoutHref}
                className="mt-3 flex min-h-12 items-center justify-center rounded-full bg-[oklch(0.48_0.12_52)] px-4 py-3 text-center text-[14px] font-semibold leading-5 text-[oklch(0.98_0.012_85)] transition-colors duration-200 hover:bg-[oklch(0.42_0.12_52)]"
                style={{ transitionTimingFunction: EASE }}
              >
                Complete escrow as {counterpartHandle}
              </Link>
              <p className="mt-2 text-[12px] leading-4 text-[oklch(0.5_0.025_55)]">
                Demonstration — pay as this buyer to close the other offers on this piece.
              </p>
            </div>
          )}
        </div>
      ) : null}

      {phase === "shipped" ? (
        <div className="mt-4">
          <p className="max-w-[40ch] text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
            Paid and handed to AJEX. Track the Marina pickup through Downtown
            delivery.
          </p>
          <Link
            href={checkoutHref}
            className="mt-3 flex h-12 items-center justify-center rounded-full border border-[oklch(0.84_0.02_75)] bg-[#FDFBF7] text-[14px] font-semibold text-[oklch(0.22_0.025_55)]"
          >
            Track with AJEX
          </Link>
        </div>
      ) : null}

      {phase === "expired" ? (
        <p className="mt-4 text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
          This offer lapsed after 24 hours. Send a new one at or above the 80%
          floor.
        </p>
      ) : null}
    </article>
  );
}

function MissedOutNotice({ brand }: { brand: string }) {
  return (
    <aside
      role="status"
      className="mt-5 rounded-[1.5rem] bg-[oklch(0.28_0.04_52)] px-5 py-5 text-[oklch(0.97_0.012_85)]"
    >
      <div className="flex items-start gap-3.5">
        <span
          aria-hidden="true"
          className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-[oklch(0.48_0.12_52)] text-[oklch(0.98_0.012_85)]"
        >
          <BoltIcon />
        </span>
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-bodoni)] text-[32px] leading-none tracking-[-0.03em]">
            Missed Out!
          </p>
          <p className="mt-3 max-w-[36ch] text-[16px] leading-6 text-[oklch(0.9_0.02_80)]">
            This item was purchased by another buyer. This chat is now closed. Tap
            below to find similar listings.
          </p>
        </div>
      </div>
      <Link
        href="/"
        className="mt-5 flex h-12 items-center justify-center rounded-full bg-[oklch(0.48_0.12_52)] text-[14px] font-semibold text-[oklch(0.98_0.012_85)] transition-colors duration-200 hover:bg-[oklch(0.42_0.12_52)]"
        style={{ transitionTimingFunction: EASE }}
      >
        Find similar {brand} listings
      </Link>
    </aside>
  );
}

function BoltIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M10.1 1.75 3.6 10.2h4.35L7.9 16.25l6.5-8.45H10.1L10.1 1.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CountdownClock({ remaining }: { remaining: number }) {
  const progress = remaining / EXPIRY_MS;
  const radius = 16;
  const circ = 2 * Math.PI * radius;
  const dash = circ * progress;

  return (
    <div className="mt-4 flex items-center gap-3">
      <svg width="42" height="42" viewBox="0 0 42 42" aria-hidden="true" className="-rotate-90">
        <circle
          cx="21"
          cy="21"
          r={radius}
          fill="none"
          stroke="oklch(0.9 0.015 80)"
          strokeWidth="3"
        />
        <circle
          cx="21"
          cy="21"
          r={radius}
          fill="none"
          stroke="oklch(0.28 0.03 55)"
          strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div>
        <p className="text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
          Offer expires in 24 hours
        </p>
        <p className="text-[16px] leading-6 tabular-nums text-[oklch(0.22_0.025_55)]">
          {formatCountdown(remaining)}
        </p>
      </div>
    </div>
  );
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M11.5 3.5 5.5 9l6 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
