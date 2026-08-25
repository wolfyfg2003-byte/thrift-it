"use client";

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
const EASE_OUT_EXPO = "cubic-bezier(0.16, 1, 0.3, 1)";

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
        setError(OFFER_FLOOR_ERROR);
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
      className="fixed inset-0 z-50 m-0 hidden h-dvh max-h-dvh w-full max-w-none border-0 bg-transparent p-0 open:grid open:place-items-end open:sm:place-items-center [&::backdrop]:bg-[oklch(0.22_0.02_55/0.46)] [&::backdrop]:backdrop-blur-[2px]"
      style={{ fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif' }}
    >
      <button
        type="button"
        aria-label="Dismiss overlay"
        className="absolute inset-0 cursor-default bg-transparent"
        onClick={closeIfIdle}
        tabIndex={-1}
      />

      <div
        className="relative z-10 flex max-h-[min(92vh,44rem)] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-[oklch(0.86_0.025_72)] bg-[oklch(0.965_0.012_78)] shadow-[0_18px_40px_-12px_oklch(0.22_0.03_55/0.28)] sm:max-w-[26.5rem] sm:rounded-[1.75rem]"
        style={{ transitionTimingFunction: EASE_OUT_EXPO }}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-3">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-[20px] leading-7 font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]"
            >
              {phase === "bargain" || phase === "sending"
                ? "Make an offer"
                : phase === "notified"
                  ? "Offer sent"
                  : "Seller replied"}
            </h2>
            <p className="mt-1 max-w-[38ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
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
            className="grid size-10 shrink-0 place-items-center rounded-full text-[oklch(0.22_0.025_55)] transition-colors duration-200 hover:bg-[oklch(0.93_0.016_72)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.5_0.11_52)] disabled:opacity-40"
            style={{ transitionTimingFunction: EASE_OUT_EXPO }}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 [scrollbar-color:oklch(0.72_0.03_55)_transparent]">
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
  onOfferChange: (value: number) => number;
  onSubmit: () => void;
}) {
  return (
    <div className="mt-5">
      <p
        id={liveId}
        className="text-[32px] leading-none font-semibold tracking-[-0.035em] text-[oklch(0.22_0.025_55)] tabular-nums"
        aria-live="polite"
      >
        {formatAed(offer)}
      </p>
      <p className="mt-2 text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
        {belowAsking === 0
          ? `Full asking · ${formatAed(asking)}`
          : `${formatAed(belowAsking)} under asking · ${discountPct}% off`}
      </p>

      <div className="mt-6">
        <div className="mb-2 flex items-end justify-between text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
          <span className="tabular-nums">{formatAed(floor)} floor</span>
          <label htmlFor={sliderId} className="text-[14px] text-[oklch(0.22_0.025_55)]">
            Your offer
          </label>
          <span className="tabular-nums">{formatAed(asking)} ask</span>
        </div>

        <input
          id={sliderId}
          type="range"
          min={floor}
          max={asking}
          step={1}
          value={offer}
          disabled={sending}
          aria-valuemin={floor}
          aria-valuemax={asking}
          aria-valuenow={offer}
          aria-valuetext={formatAed(offer)}
          aria-invalid={error ? true : undefined}
          aria-errormessage={error ? errorId : undefined}
          onChange={(event) => onOfferChange(Number(event.target.value))}
          className="h-8 w-full cursor-pointer appearance-none bg-transparent disabled:cursor-not-allowed disabled:opacity-50 [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[oklch(0.965_0.012_78)] [&::-moz-range-thumb]:bg-[oklch(0.48_0.12_52)] [&::-moz-range-thumb]:shadow-[0_4px_10px_-2px_oklch(0.35_0.08_52/0.45)] [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:-mt-[9px] [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[oklch(0.965_0.012_78)] [&::-webkit-slider-thumb]:bg-[oklch(0.48_0.12_52)] [&::-webkit-slider-thumb]:shadow-[0_4px_10px_-2px_oklch(0.35_0.08_52/0.45)]"
          style={{
            background: `linear-gradient(to right, oklch(0.48 0.12 52) 0%, oklch(0.48 0.12 52) ${fillPct}%, oklch(0.88 0.02 72) ${fillPct}%, oklch(0.88 0.02 72) 100%)`,
            backgroundSize: "100% 6px",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
      </div>

      <p className="mt-3 text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
        Floor is 80% of asking. Lower amounts never leave this screen.
      </p>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-3 rounded-2xl bg-[oklch(0.93_0.04_45)] px-3.5 py-3 text-[14px] leading-5 text-[oklch(0.38_0.09_40)]"
        >
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onSubmit}
        disabled={sending || Boolean(error) || offer < floor}
        className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[oklch(0.48_0.12_52)] text-[14px] font-semibold tracking-[-0.01em] text-[oklch(0.98_0.01_78)] transition-[background-color,transform] duration-200 hover:bg-[oklch(0.42_0.12_52)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.48_0.12_52)] active:bg-[oklch(0.38_0.11_52)] disabled:bg-[oklch(0.82_0.02_72)] disabled:text-[oklch(0.5_0.02_55)]"
        style={{ transitionTimingFunction: EASE_OUT_EXPO }}
      >
        {sending ? "Sending offer…" : `Send ${formatAed(offer)} offer`}
      </button>
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
      <article className="rounded-[1.35rem] bg-[oklch(0.935_0.016_72)] px-4 py-4">
        <h3 className="text-[16px] leading-6 font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
          New offer on {brand}
        </h3>
        <p className="mt-1 max-w-[40ch] text-[14px] leading-5 text-[oklch(0.38_0.03_55)]">
          A buyer offered {formatAed(offer)} on your {formatAed(asking)} listing.
        </p>

        {counterOpen ? (
          <div className="mt-4">
            <label
              htmlFor="counter-amount"
              className="text-[14px] leading-5 text-[oklch(0.22_0.025_55)]"
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
              className="mt-2 h-12 w-full rounded-2xl border border-[oklch(0.84_0.025_72)] bg-[oklch(0.965_0.012_78)] px-3.5 text-[16px] text-[oklch(0.22_0.025_55)] tabular-nums caret-[oklch(0.48_0.12_52)] outline-none focus:border-[oklch(0.48_0.12_52)]"
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onCancelCounter}
                className="h-11 rounded-full border border-[oklch(0.84_0.025_72)] text-[14px] font-semibold text-[oklch(0.22_0.025_55)] transition-colors duration-200 hover:bg-[oklch(0.91_0.016_72)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.48_0.12_52)]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={onSendCounter}
                className="h-11 rounded-full bg-[oklch(0.48_0.12_52)] text-[14px] font-semibold text-[oklch(0.98_0.01_78)] transition-colors duration-200 hover:bg-[oklch(0.42_0.12_52)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.48_0.12_52)]"
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
    "h-11 rounded-full text-[14px] font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.48_0.12_52)]";
  const styles =
    tone === "primary"
      ? "bg-[oklch(0.48_0.12_52)] text-[oklch(0.98_0.01_78)] hover:bg-[oklch(0.42_0.12_52)] active:bg-[oklch(0.38_0.11_52)]"
      : "bg-[oklch(0.965_0.012_78)] text-[oklch(0.22_0.025_55)] hover:bg-[oklch(0.91_0.016_72)] active:bg-[oklch(0.88_0.02_72)]";

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
    <div className="mt-5 rounded-[1.35rem] bg-[oklch(0.935_0.016_72)] px-4 py-4">
      <p className="text-[16px] leading-6 font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
        {resolutionCopy(resolution, asking)}
      </p>
      {resolution.status === "accepted" ? (
        <p className="mt-2 max-w-[40ch] text-[14px] leading-5 text-[oklch(0.38_0.03_55)]">
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
          className="size-[4.25rem] shrink-0 rounded-2xl object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="grid size-[4.25rem] shrink-0 place-items-center rounded-2xl bg-[oklch(0.9_0.03_62)] text-[20px] font-semibold text-[oklch(0.38_0.05_52)]"
        >
          {listing.brand.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-[16px] leading-6 font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
          {garment}
        </p>
        {meta ? (
          <p className="mt-0.5 text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">{meta}</p>
        ) : null}
        <p className="mt-1 text-[14px] leading-5 text-[oklch(0.22_0.025_55)] tabular-nums">
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
