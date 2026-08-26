"use client";

import { StampBadge } from "@/components/brand/StampBadge";
import { WashiTape } from "@/components/brand/WashiTape";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

/** Offers must be ≥ 80% of asking — the 20% negotiation floor. */
export const OFFER_FLOOR_RATIO = 0.8;

export const OFFER_FLOOR_ERROR =
  "To respect our sellers' time, offers must be at least 80% of the asking price.";

const ACCEPTANCE_WINDOW_HOURS = 24;
const EASE_OUT_EXPO = "cubic-bezier(0.19, 1, 0.22, 1)";

export type OfferStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "countered";

export type OfferModalListing = {
  id: string;
  brand: string;
  title?: string;
  size?: string;
  condition?: string;
  price: number;
  original_photo_url?: string | null;
  is_consignment?: boolean;
};

export type SubmittedOffer = {
  listing_id: string;
  buyer_id?: string;
  offered_price: number;
  status: OfferStatus;
  expires_at?: string;
};

type BargainPhase = "bargain" | "sending" | "notified" | "resolved";

export type OfferModalProps = {
  open: boolean;
  listing: OfferModalListing;
  buyerId?: string;
  onClose: () => void;
  onOfferSubmitted?: (offer: SubmittedOffer) => void;
  onSellerAction?: (offer: SubmittedOffer) => void;
};

export function getOfferFloor(askingPrice: number): number {
  if (!Number.isFinite(askingPrice) || askingPrice <= 0) return 0;
  return Math.ceil(askingPrice * OFFER_FLOOR_RATIO);
}

export function isOfferAtOrAboveFloor(
  offeredPrice: number,
  askingPrice: number,
): boolean {
  return offeredPrice >= getOfferFloor(askingPrice);
}

function formatAed(amount: number): string {
  return `AED ${Math.round(amount).toLocaleString("en-US")}`;
}

function clampOffer(value: number, floor: number, asking: number): number {
  if (!Number.isFinite(value)) return asking;
  return Math.min(asking, Math.max(floor, Math.round(value)));
}

export default function OfferModal({
  open,
  listing,
  buyerId,
  onClose,
  onOfferSubmitted,
  onSellerAction,
}: OfferModalProps) {
  const asking = Math.max(0, Math.round(listing.price));
  const floor = getOfferFloor(asking);
  const titleId = useId();
  const sliderId = useId();
  const errorId = useId();
  const liveId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const [offer, setOffer] = useState(asking);
  const [phase, setPhase] = useState<BargainPhase>("bargain");
  const [error, setError] = useState<string | null>(null);
  const [resolution, setResolution] = useState<SubmittedOffer | null>(null);
  const [counterDraft, setCounterDraft] = useState<number | null>(null);
  const [counterOpen, setCounterOpen] = useState(false);
  const [floorPulse, setFloorPulse] = useState(0);

  const range = Math.max(asking - floor, 1);
  const fillPct = useMemo(() => {
    if (asking <= floor) return 100;
    return ((offer - floor) / range) * 100;
  }, [offer, floor, asking, range]);

  const belowAsking = asking - offer;
  const discountPct =
    asking > 0 ? Math.round(((asking - offer) / asking) * 100) : 0;

  const reset = useCallback(() => {
    setOffer(asking);
    setPhase("bargain");
    setError(null);
    setResolution(null);
    setCounterDraft(null);
    setCounterOpen(false);
  }, [asking]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      reset();
      if (!dialog.open) dialog.showModal();
      queueMicrotask(() => closeRef.current?.focus());
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open, reset]);

  useEffect(() => {
    setOffer((current) => clampOffer(current, floor, asking));
  }, [floor, asking]);

  const applyOffer = useCallback(
    (raw: number) => {
      const next = clampOffer(raw, floor, asking);
      setOffer(next);
      if (raw < floor) {
        setError(null);
        setFloorPulse((value) => (value === 0 ? 1 : value));
      } else if (next > floor) {
        setError(null);
        setFloorPulse(0);
      } else {
        setError(null);
      }
      return next;
    },
    [floor, asking],
  );

  const closeIfIdle = useCallback(() => {
    if (phase === "sending") return;
    onClose();
  }, [phase, onClose]);

  const submitOffer = useCallback(() => {
    if (phase !== "bargain") return;

    if (!isOfferAtOrAboveFloor(offer, asking) || offer > asking) {
      setError(OFFER_FLOOR_ERROR);
      applyOffer(offer);
      return;
    }

    setError(null);
    setPhase("sending");

    window.setTimeout(() => {
      const submitted: SubmittedOffer = {
        listing_id: listing.id,
        buyer_id: buyerId,
        offered_price: offer,
        status: "pending",
      };
      onOfferSubmitted?.(submitted);
      setPhase("notified");
    }, 220);
  }, [phase, offer, asking, applyOffer, listing.id, buyerId, onOfferSubmitted]);

  const resolveOffer = useCallback(
    (status: OfferStatus, counterPrice?: number) => {
      const payload: SubmittedOffer = {
        listing_id: listing.id,
        buyer_id: buyerId,
        offered_price: offer,
        status,
        expires_at:
          status === "accepted"
            ? new Date(
                Date.now() + ACCEPTANCE_WINDOW_HOURS * 60 * 60 * 1000,
              ).toISOString()
            : undefined,
      };

      if (status === "countered") {
        payload.offered_price = counterPrice ?? offer;
      }

      setResolution(payload);
      setPhase("resolved");
      onSellerAction?.(payload);
    },
    [listing.id, buyerId, offer, onSellerAction],
  );

  const sendCounter = useCallback(() => {
    if (counterDraft == null) return;
    const next = clampOffer(counterDraft, Math.max(floor, offer), asking);
    if (next < floor) {
      setError(OFFER_FLOOR_ERROR);
      return;
    }
    resolveOffer("countered", next);
  }, [counterDraft, floor, offer, asking, resolveOffer]);

  if (asking <= 0) return null;

  const garment = listing.title?.trim() || listing.brand;
  const meta = [listing.size, listing.condition].filter(Boolean).join(" · ");

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={liveId}
      onClose={closeIfIdle}
      onCancel={(event) => {
        if (phase === "sending") event.preventDefault();
      }}
      className="fixed inset-0 z-50 m-0 hidden h-dvh max-h-dvh w-full max-w-none border-0 bg-transparent p-0 open:grid open:place-items-end open:sm:place-items-center [&::backdrop]:bg-[#2A1A14]/45"
    >
      <button
        type="button"
        aria-label="Dismiss overlay"
        className="absolute inset-0 cursor-default bg-transparent"
        onClick={closeIfIdle}
        tabIndex={-1}
      />

      <div
        className="cardboard-sheet relative z-10 flex max-h-[min(92vh,44rem)] w-full flex-col overflow-hidden border border-[#2A1A14] shadow-[4px_4px_0_0_#2A1A14] sm:max-w-[26.5rem]"
        style={{ transitionTimingFunction: EASE_OUT_EXPO }}
      >
        <WashiTape tone="mustard" corner="tl" />
        <WashiTape tone="rose" corner="tr" />
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-3">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="font-[family-name:var(--font-typewriter)] text-[20px] leading-7 text-[#2A1A14]"
            >
              {phase === "bargain" || phase === "sending"
                ? "Make an offer"
                : phase === "notified"
                  ? "Offer sent"
                  : "Seller replied"}
            </h2>
            <p className="mt-1 max-w-[38ch] text-[16px] leading-6 text-[#6B4A3A]">
              {phase === "bargain" || phase === "sending"
                ? "Slide to a price the seller will actually see. Anything below 80% of asking is blocked."
                : phase === "notified"
                  ? "Simulated seller push — one tap to accept, decline, or counter."
                  : resolutionCopy(resolution, asking)}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={closeIfIdle}
            disabled={phase === "sending"}
            aria-label="Close"
            className="grid size-10 shrink-0 place-items-center border border-[#2A1A14] bg-[#F4EFE6] text-[#2A1A14] transition-colors duration-200 hover:bg-[#E4D5C1] disabled:opacity-40"
            style={{ transitionTimingFunction: EASE_OUT_EXPO }}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 [scrollbar-color:#C9B8A4_transparent]">
          <ListingStrip listing={listing} asking={asking} garment={garment} meta={meta} />

          {phase === "bargain" || phase === "sending" ? (
            <BargainPanel
              asking={asking}
              floor={floor}
              offer={offer}
              fillPct={fillPct}
              belowAsking={belowAsking}
              discountPct={discountPct}
              error={error}
              errorId={errorId}
              sliderId={sliderId}
              liveId={liveId}
              sending={phase === "sending"}
              floorPulse={floorPulse}
              onOfferChange={applyOffer}
              onSubmit={submitOffer}
            />
          ) : phase === "notified" ? (
            <SellerPush
              brand={listing.brand}
              offer={offer}
              asking={asking}
              counterOpen={counterOpen}
              counterDraft={counterDraft}
              floor={floor}
              onAccept={() => resolveOffer("accepted")}
              onDecline={() => resolveOffer("declined")}
              onCounter={() => {
                setCounterOpen(true);
                setCounterDraft(clampOffer(Math.round((offer + asking) / 2), offer, asking));
              }}
              onCounterDraft={setCounterDraft}
              onSendCounter={sendCounter}
              onCancelCounter={() => setCounterOpen(false)}
            />
          ) : (
            <ResolutionCard resolution={resolution} asking={asking} />
          )}
        </div>
      </div>
    </dialog>
  );
}

function BargainPanel({
  asking,
  floor,
  offer,
  fillPct,
  belowAsking,
  discountPct,
  error,
  errorId,
  sliderId,
  liveId,
  sending,
  floorPulse,
  onOfferChange,
  onSubmit,
}: {
  asking: number;
  floor: number;
  offer: number;
  fillPct: number;
  belowAsking: number;
  discountPct: number;
  error: string | null;
  errorId: string;
  sliderId: string;
  liveId: string;
  sending: boolean;
  floorPulse: number;
  onOfferChange: (value: number) => number;
  onSubmit: () => void;
}) {
  const atFloor = offer <= floor;
  return (
    <div className="mt-5">
      <p
        id={liveId}
        className="font-[family-name:var(--font-handwritten)] text-[32px] leading-none text-[#2A1A14] tabular-nums"
        aria-live="polite"
      >
        {formatAed(offer)}
      </p>
      <p className="mt-2 text-[14px] leading-5 text-[#6B4A3A]">
        {belowAsking === 0
          ? `Full asking · ${formatAed(asking)}`
          : `${formatAed(belowAsking)} under asking · ${discountPct}% off`}
      </p>

      <div className="mt-6">
        <div className="mb-2 flex items-end justify-between text-[12px] leading-4 text-[#6B4A3A]">
          <span className="tabular-nums">{formatAed(floor)} floor</span>
          <label htmlFor={sliderId} className="text-[14px] text-[#2A1A14]">
            Your offer
          </label>
          <span className="tabular-nums">{formatAed(asking)} ask</span>
        </div>

        <HaggleSlider
          id={sliderId}
          floor={floor}
          asking={asking}
          value={offer}
          fillPct={fillPct}
          disabled={sending}
          error={error}
          errorId={errorId}
          onChange={onOfferChange}
        />
      </div>

      {atFloor ? (
        <div
          className={`mt-4 ${floorPulse > 0 ? "floor-lock-shake" : ""}`}
          style={{ transitionTimingFunction: EASE_OUT_EXPO }}
        >
          <StampBadge
            key={floorPulse}
            label="Seller protection floor"
          />
        </div>
      ) : null}

      <p className="mt-3 text-[12px] leading-4 text-[#6B4A3A]">
        Floor is 80% of asking. The handle locks there — lower amounts never leave this screen.
      </p>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-3 border border-[#2A1A14] bg-[#E4D5C1] px-3.5 py-3 text-[14px] leading-5 text-[#2A1A14]"
        >
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onSubmit}
        disabled={sending || Boolean(error) || offer < floor}
        className="mt-6 flex h-12 w-full items-center justify-center border border-[#2A1A14] bg-[#D8829D] text-[14px] font-semibold tracking-[-0.01em] text-[#2A1A14] shadow-[4px_4px_0_0_#2A1A14] transition-colors duration-200 hover:bg-[#c9738e] disabled:bg-[#C9B8A4] disabled:text-[#6B4A3A] disabled:shadow-none"
        style={{ transitionTimingFunction: EASE_OUT_EXPO }}
      >
        {sending ? "Sending offer…" : `Send ${formatAed(offer)} offer`}
      </button>
    </div>
  );
}

function HaggleSlider({
  id,
  floor,
  asking,
  value,
  fillPct,
  disabled,
  error,
  errorId,
  onChange,
}: {
  id: string;
  floor: number;
  asking: number;
  value: number;
  fillPct: number;
  disabled: boolean;
  error: string | null;
  errorId: string;
  onChange: (value: number) => number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [overdrag, setOverdrag] = useState(0);
  const dragging = useRef(false);

  const readRaw = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return value;
    const rect = track.getBoundingClientRect();
    const t = (clientX - rect.left) / Math.max(rect.width, 1);
    return floor + t * Math.max(asking - floor, 1);
  };

  const applyPointer = (clientX: number, releasing: boolean) => {
    const raw = readRaw(clientX);
    if (raw < floor) {
      const extra = Math.min(12, ((floor - raw) / Math.max(asking - floor, 1)) * 48);
      setOverdrag(-extra);
      onChange(raw);
    } else {
      setOverdrag(0);
      onChange(raw);
    }
    if (releasing) setOverdrag(0);
  };

  return (
    <div
      ref={trackRef}
      className={`relative h-8 w-full ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      onPointerDown={(event) => {
        if (disabled) return;
        dragging.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        applyPointer(event.clientX, false);
      }}
      onPointerMove={(event) => {
        if (!dragging.current || disabled) return;
        applyPointer(event.clientX, false);
      }}
      onPointerUp={(event) => {
        if (!dragging.current) return;
        dragging.current = false;
        applyPointer(event.clientX, true);
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          /* already released */
        }
      }}
      onPointerCancel={() => {
        dragging.current = false;
        setOverdrag(0);
      }}
    >
      <input
        id={id}
        type="range"
        min={floor}
        max={asking}
        step={1}
        value={value}
        disabled={disabled}
        aria-valuemin={floor}
        aria-valuemax={asking}
        aria-valuenow={value}
        aria-valuetext={formatAed(value)}
        aria-invalid={error ? true : undefined}
        aria-errormessage={error ? errorId : undefined}
        onChange={(event) => onChange(Number(event.target.value))}
        className="sr-only"
      />
      <div
        className="absolute top-1/2 right-0 left-0 h-1.5 -translate-y-1/2 rounded-full"
        style={{
          background: `linear-gradient(to right, #D8829D 0%, #D8829D ${fillPct}%, #C9B8A4 ${fillPct}%, #C9B8A4 100%)`,
        }}
      />
      <div
        className="absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 border-2 border-[#F4EFE6] bg-[#D8829D] shadow-[3px_3px_0_0_#2A1A14]"
        style={{
          left: `calc(${fillPct}% + ${overdrag}px)`,
          transition: dragging.current
            ? "none"
            : `left 420ms ${EASE_OUT_EXPO}`,
        }}
      />
    </div>
  );
}

function SellerPush({
  brand,
  offer,
  asking,
  counterOpen,
  counterDraft,
  floor,
  onAccept,
  onDecline,
  onCounter,
  onCounterDraft,
  onSendCounter,
  onCancelCounter,
}: {
  brand: string;
  offer: number;
  asking: number;
  counterOpen: boolean;
  counterDraft: number | null;
  floor: number;
  onAccept: () => void;
  onDecline: () => void;
  onCounter: () => void;
  onCounterDraft: (value: number) => void;
  onSendCounter: () => void;
  onCancelCounter: () => void;
}) {
  return (
    <div className="mt-5">
      <article className="border border-[#2A1A14] bg-[#F4EFE6] px-4 py-4 shadow-[3px_3px_0_0_#2A1A14]">
        <h3 className="font-[family-name:var(--font-typewriter)] text-[16px] leading-6 text-[#2A1A14]">
          New offer on {brand}
        </h3>
        <p className="mt-1 max-w-[40ch] text-[14px] leading-5 text-[#6B4A3A]">
          A buyer offered {formatAed(offer)} on your {formatAed(asking)} listing.
        </p>

        {counterOpen ? (
          <div className="mt-4">
            <label
              htmlFor="counter-amount"
              className="text-[14px] leading-5 text-[#2A1A14]"
            >
              Counter amount
            </label>
            <input
              id="counter-amount"
              type="number"
              min={Math.max(floor, offer)}
              max={asking}
              step={1}
              value={counterDraft ?? ""}
              onChange={(event) => onCounterDraft(Number(event.target.value))}
              className="mt-2 h-12 w-full border border-[#2A1A14] bg-[#F9F6F0] px-3.5 text-[16px] text-[#2A1A14] tabular-nums caret-[#D8829D] outline-none focus:border-[#4B6584]"
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onCancelCounter}
                className="h-11 border border-[#2A1A14] bg-[#F4EFE6] text-[14px] font-semibold text-[#2A1A14] hover:bg-[#E4D5C1]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={onSendCounter}
                className="h-11 border border-[#2A1A14] bg-[#D8829D] text-[14px] font-semibold text-[#2A1A14] shadow-[3px_3px_0_0_#2A1A14]"
              >
                Send counter
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-2">
            <TapButton label="Accept" onClick={onAccept} tone="primary" />
            <TapButton label="Decline" onClick={onDecline} tone="quiet" />
            <TapButton label="Counter" onClick={onCounter} tone="quiet" />
          </div>
        )}
      </article>
    </div>
  );
}

function TapButton({
  label,
  onClick,
  tone,
}: {
  label: string;
  onClick: () => void;
  tone: "primary" | "quiet";
}) {
  const base =
    "h-11 text-[14px] font-semibold transition-colors duration-200 border border-[#2A1A14]";
  const styles =
    tone === "primary"
      ? "bg-[#D8829D] text-[#2A1A14] shadow-[3px_3px_0_0_#2A1A14]"
      : "bg-[#F4EFE6] text-[#2A1A14]";

  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`}>
      {label}
    </button>
  );
}

function ResolutionCard({
  resolution,
  asking,
}: {
  resolution: SubmittedOffer | null;
  asking: number;
}) {
  if (!resolution) return null;

  return (
    <div className="mt-5 border border-[#2A1A14] bg-[#F4EFE6] px-4 py-4 shadow-[3px_3px_0_0_#2A1A14]">
      <p className="font-[family-name:var(--font-typewriter)] text-[16px] leading-6 text-[#2A1A14]">
        {resolutionCopy(resolution, asking)}
      </p>
      {resolution.status === "accepted" ? (
        <p className="mt-2 max-w-[40ch] text-[14px] leading-5 text-[#6B4A3A]">
          Listing locks to offer_accepted. Unpaid offers return to active after{" "}
          {ACCEPTANCE_WINDOW_HOURS} hours.
        </p>
      ) : null}
    </div>
  );
}

function resolutionCopy(resolution: SubmittedOffer | null, asking: number): string {
  if (!resolution) return "Waiting for the seller.";
  if (resolution.status === "accepted") {
    return `Accepted at ${formatAed(resolution.offered_price)}. Buyer has ${ACCEPTANCE_WINDOW_HOURS} hours to pay into escrow.`;
  }
  if (resolution.status === "declined") {
    return `Declined. Asking stays ${formatAed(asking)}.`;
  }
  if (resolution.status === "countered") {
    return `Counter sent at ${formatAed(resolution.offered_price)}.`;
  }
  return "Offer is with the seller.";
}

function ListingStrip({
  listing,
  asking,
  garment,
  meta,
}: {
  listing: OfferModalListing;
  asking: number;
  garment: string;
  meta: string;
}) {
  return (
    <div className="flex items-center gap-3.5">
      {listing.original_photo_url ? (
        <img
          src={listing.original_photo_url}
          alt=""
          className="size-[4.25rem] shrink-0 border border-[#2A1A14] object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="grid size-[4.25rem] shrink-0 place-items-center border border-[#2A1A14] bg-[#E4D5C1] font-[family-name:var(--font-display)] text-[20px] text-[#2A1A14]"
        >
          {listing.brand.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate font-[family-name:var(--font-typewriter)] text-[16px] leading-6 text-[#2A1A14]">
          {garment}
        </p>
        {meta ? (
          <p className="mt-0.5 text-[12px] leading-4 text-[#6B4A3A]">{meta}</p>
        ) : null}
        <p className="mt-1 font-[family-name:var(--font-handwritten)] text-[16px] leading-5 text-[#2A1A14]">
          Asking {formatAed(asking)}
        </p>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.2 3.2 12.8 12.8M12.8 3.2 3.2 12.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
