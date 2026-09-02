"use client";

import AppDock from "@/components/AppDock";
import {
  formatAed,
  INSPECTION_HOURS,
  quoteCheckout,
} from "@/lib/checkout";
import type { Listing } from "@/lib/listings";
import { markListingSold } from "@/lib/listing-sale-store";
import {
  AUTO_RELEASE_MS,
  formatAutoReleaseCopy,
  type AjexStatus,
  type TransactionRecord,
} from "@/lib/transactions";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const ESCROW_WARNING =
  "Funds are held securely in Thrift It Escrow and auto-release 12 hours after delivery unless you accept earlier or open a dispute.";

const AJEX_STEPS = [
  {
    id: "label_printed" as const,
    label: "Prepaid label generated",
    detail: "Shipping label created. Driver dispatched to the seller.",
  },
  {
    id: "picked_up" as const,
    label: "Picked up",
    detail: "Package picked up from Dubai Marina.",
  },
  {
    id: "out_for_delivery" as const,
    label: "Out for delivery",
    detail: "Out for delivery to Downtown Dubai.",
  },
  {
    id: "delivered" as const,
    label: "Delivered",
    detail: "Delivered. 12-hour inspection escrow is now running.",
  },
];

const AJEX_ORDER: AjexStatus[] = [
  "label_printed",
  "picked_up",
  "out_for_delivery",
  "delivered",
];

type CardFields = {
  name: string;
  number: string;
  expiry: string;
  cvc: string;
};

type FieldErrors = Partial<Record<keyof CardFields, string>>;

async function postTransaction(
  path: string,
  body: Record<string, string | number>,
): Promise<TransactionRecord> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as {
    transaction?: TransactionRecord;
    error?: string;
  };
  if (!response.ok || !data.transaction) {
    throw new Error(data.error ?? "Request failed.");
  }
  return data.transaction;
}

export default function CheckoutScreen({
  listing,
  chatId,
}: {
  listing: Listing;
  chatId: string | null;
}) {
  const quote = useMemo(() => quoteCheckout(listing.price), [listing.price]);
  const [card, setCard] = useState<CardFields>({
    name: "",
    number: "",
    expiry: "",
    cvc: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [paying, setPaying] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [tx, setTx] = useState<TransactionRecord | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const autoReleaseSent = useRef(false);
  const lostThisChat =
    Boolean(tx) &&
    chatId !== null &&
    tx?.purchased_by_chat_id !== null &&
    tx?.purchased_by_chat_id !== chatId;

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/payment/status?listingId=${encodeURIComponent(listing.id)}`)
      .then((response) => response.json())
      .then((data: { transaction?: TransactionRecord | null }) => {
        if (cancelled || !data.transaction) return;
        setTx(data.transaction);
        markListingSold(
          listing.id,
          data.transaction.purchased_by_chat_id,
        );
      });
    return () => {
      cancelled = true;
    };
  }, [listing.id]);

  useEffect(() => {
    if (lostThisChat) return;
    if (!tx || tx.status !== "escrow_held" || tx.ajex_status === "delivered") return;
    const timer = window.setTimeout(() => {
      const index = AJEX_ORDER.indexOf(tx.ajex_status);
      const next = AJEX_ORDER[Math.min(index + 1, AJEX_ORDER.length - 1)];
      void postTransaction("/api/payment/tracking", {
        listingId: listing.id,
        ajex_status: next,
      }).then(setTx);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [listing.id, lostThisChat, tx]);

  useEffect(() => {
    if (!tx?.auto_release_at || tx.status !== "escrow_held" || tx.disputed) return;
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, [tx]);

  const remainingMs =
    tx?.auto_release_at && tx.status === "escrow_held"
      ? Math.max(0, tx.auto_release_at - now)
      : AUTO_RELEASE_MS;

  useEffect(() => {
    if (lostThisChat) return;
    if (!tx || tx.status !== "escrow_held" || tx.ajex_status !== "delivered" || tx.disputed) {
      return;
    }
    if (remainingMs > 0 || autoReleaseSent.current) return;
    autoReleaseSent.current = true;
    void postTransaction("/api/payment/release", {
      listingId: listing.id,
      source: "auto_release",
    }).then(setTx);
  }, [listing.id, lostThisChat, remainingMs, tx]);

  const onPay = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateCard(card);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPaying(true);
    setPayError(null);
    const payload: Record<string, string | number> = {
      listingId: listing.id,
      itemPrice: listing.price,
    };
    if (chatId) payload.chatId = chatId;

    void postTransaction("/api/payment/escrow", payload)
      .then((transaction) => {
        markListingSold(listing.id, chatId);
        setTx(transaction);
        setCard({ name: "", number: "", expiry: "", cvc: "" });
      })
      .catch((error: unknown) => {
        setPayError(error instanceof Error ? error.message : "Could not open escrow.");
      })
      .finally(() => setPaying(false));
  };

  const acceptOrder = () => {
    if (releasing) return;
    setReleasing(true);
    void postTransaction("/api/payment/release", {
      listingId: listing.id,
      source: "buyer_accept",
    })
      .then(setTx)
      .finally(() => setReleasing(false));
  };

  const submitDispute = (reason: string, details: string) => {
    void postTransaction("/api/payment/dispute", {
      listingId: listing.id,
      reason,
      details,
    }).then((transaction) => {
      setTx(transaction);
      setDisputeOpen(false);
    });
  };

  const paid = Boolean(tx) && !lostThisChat;
  const delivered = tx?.ajex_status === "delivered";
  const inspectionOpen = delivered && tx?.status === "escrow_held";

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[28rem] bg-[#F9F6F0] px-5 pb-[calc(9.75rem+env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="max-w-[42ch]">
        <h1 className="font-[family-name:var(--font-display)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.22_0.025_55)]">
          {lostThisChat
            ? "Sold Out"
            : tx?.status === "completed"
              ? "Order complete"
              : paid
                ? "Held in escrow"
                : "Checkout"}
        </h1>
        <p className="mt-3 text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
          {lostThisChat
            ? "Another buyer already paid into escrow. This listing is closed."
            : tx?.status === "completed"
              ? "You accepted the piece. Payout is on its way to the seller."
              : paid
                ? "Mamo Pay authorized the charge. AJEX is moving the garment across Dubai."
                : "Pay once. Thrift It holds the funds until you have inspected the piece."}
        </p>
      </header>

      <ListingStrip listing={listing} />
      <p className="mt-3 text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
        Demonstration checkout — no card is charged.
      </p>
      {payError ? (
        <p role="alert" className="mt-2 text-[14px] leading-5 text-[oklch(0.42_0.1_40)]">
          {payError}
        </p>
      ) : null}

      <section className="mt-7 rounded-[1.35rem] bg-[oklch(0.96_0.01_82)] px-4 py-4">
        <h2 className="text-[20px] leading-7 font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
          Order summary
        </h2>
        <dl className="mt-3 divide-y divide-[oklch(0.88_0.018_80)]">
          <Row label="Listing price" value={formatAed(quote.item_price)} />
          <Row
            label="Buyer protection fee (20%)"
            value={formatAed(quote.buyer_protection_fee)}
            hint="Escrow, tracking, and the inspection window."
          />
          <Row
            label="AJEX at-home delivery"
            value={formatAed(quote.shipping_fee)}
            hint="Flat rate. Pickup and drop-off in Dubai."
          />
        </dl>
        <div className="mt-4 flex items-end justify-between gap-4">
          <p className="text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
            Final total
          </p>
          <p className="font-[family-name:var(--font-display)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.22_0.025_55)] tabular-nums">
            {formatAed(quote.total_charge)}
          </p>
        </div>
      </section>

      {!paid && !lostThisChat ? (
        <form onSubmit={onPay} noValidate className="mt-6">
          <section className="rounded-[1.35rem] bg-[oklch(0.96_0.01_82)] px-4 py-4">
            <h2 className="text-[20px] leading-7 font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
              Mamo Pay
            </h2>
            <p className="mt-1 max-w-[40ch] text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
              Simulated card form. Any 16-digit number authorizes escrow.
            </p>

            <div className="mt-5 flex flex-col gap-4">
              <TextField
                id="card-name"
                label="Name on card"
                autoComplete="cc-name"
                value={card.name}
                error={errors.name}
                onChange={(name) => {
                  setCard((prev) => ({ ...prev, name }));
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }}
              />
              <TextField
                id="card-number"
                label="Card number"
                inputMode="numeric"
                autoComplete="cc-number"
                value={card.number}
                error={errors.number}
                onChange={(number) => {
                  setCard((prev) => ({ ...prev, number: formatCardNumber(number) }));
                  setErrors((prev) => ({ ...prev, number: undefined }));
                }}
                placeholder="•••• •••• •••• ••••"
              />
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  id="card-expiry"
                  label="Expiry"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  value={card.expiry}
                  error={errors.expiry}
                  placeholder="MM / YY"
                  onChange={(expiry) => {
                    setCard((prev) => ({ ...prev, expiry: formatExpiry(expiry) }));
                    setErrors((prev) => ({ ...prev, expiry: undefined }));
                  }}
                />
                <TextField
                  id="card-cvc"
                  label="CVC"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  value={card.cvc}
                  error={errors.cvc}
                  placeholder="123"
                  onChange={(cvc) => {
                    setCard((prev) => ({
                      ...prev,
                      cvc: cvc.replace(/\D/g, "").slice(0, 4),
                    }));
                    setErrors((prev) => ({ ...prev, cvc: undefined }));
                  }}
                />
              </div>
            </div>
          </section>

          <div className="fixed inset-x-0 bottom-[calc(4.15rem+env(safe-area-inset-bottom))] z-20 border-t border-[oklch(0.88_0.018_80)] bg-[#F9F6F0] px-5 py-3">
            <div className="mx-auto max-w-[28rem]">
              <button
                type="submit"
                disabled={paying}
                className="flex h-12 w-full items-center justify-center rounded-full bg-[oklch(0.48_0.12_52)] text-[14px] font-semibold tracking-[-0.01em] text-[oklch(0.98_0.012_85)] transition-colors duration-200 hover:bg-[oklch(0.42_0.12_52)] active:bg-[oklch(0.38_0.11_52)] disabled:bg-[oklch(0.82_0.02_72)] disabled:text-[oklch(0.5_0.02_55)]"
                style={{ transitionTimingFunction: EASE }}
              >
                {paying ? "Authorizing Mamo Pay…" : "Secure Escrow Payment"}
              </button>
            </div>
          </div>
        </form>
      ) : lostThisChat ? (
        <aside className="mt-6 rounded-[1.5rem] bg-[oklch(0.28_0.04_52)] px-5 py-5 text-[oklch(0.97_0.012_85)]">
          <p className="font-[family-name:var(--font-display)] text-[32px] leading-none tracking-[-0.03em]">
            Missed Out!
          </p>
          <p className="mt-3 max-w-[36ch] text-[16px] leading-6 text-[oklch(0.9_0.02_80)]">
            This item was purchased by another buyer. Escrow is already held.
          </p>
          <Link
            href="/"
            className="mt-5 flex h-12 items-center justify-center rounded-full bg-[oklch(0.48_0.12_52)] text-[14px] font-semibold text-[oklch(0.98_0.012_85)]"
          >
            Find similar listings
          </Link>
        </aside>
      ) : (
        <div className="mt-6">
          <EscrowBanner />

          <section className="mt-4 rounded-[1.35rem] bg-[oklch(0.96_0.01_82)] px-4 py-4">
            <h2 className="text-[20px] leading-7 font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
              AJEX tracking
            </h2>
            <p className="mt-1 text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
              Simulated courier status. Label stored for the seller dashboard.
            </p>

            <ol className="mt-5">
              {AJEX_STEPS.map((step, index) => {
                const currentIndex = AJEX_STEPS.findIndex(
                  (item) => item.id === tx?.ajex_status,
                );
                const state =
                  index < currentIndex
                    ? "done"
                    : index === currentIndex
                      ? "current"
                      : "todo";
                return (
                  <li key={step.id} className="flex gap-3.5">
                    <div className="flex w-4 flex-col items-center">
                      <span
                        className={`mt-1 size-2.5 rounded-full ${
                          state === "todo"
                            ? "border border-[oklch(0.78_0.03_72)] bg-transparent"
                            : "bg-[oklch(0.48_0.12_52)]"
                        }`}
                      />
                      {index < AJEX_STEPS.length - 1 ? (
                        <span
                          className={`w-px flex-1 ${
                            state === "done"
                              ? "bg-[oklch(0.48_0.12_52)]"
                              : "bg-[oklch(0.88_0.018_80)]"
                          }`}
                        />
                      ) : null}
                    </div>
                    <div className={index < AJEX_STEPS.length - 1 ? "pb-5" : ""}>
                      <p
                        className={`text-[16px] leading-6 ${
                          state === "todo"
                            ? "text-[oklch(0.55_0.025_55)]"
                            : "font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="mt-0.5 max-w-[36ch] text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
                        {step.detail}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {delivered ? (
            <section className="mt-4 rounded-[1.35rem] bg-[oklch(0.945_0.02_72)] px-4 py-4">
              {tx?.status === "frozen" ? (
                <>
                  <p className="text-[16px] leading-6 text-[oklch(0.32_0.05_45)]">
                    Dispute opened. The 12-hour clock is frozen. Escrow will not
                    auto-release.
                  </p>
                  {tx.dispute?.reason ? (
                    <p className="mt-2 text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
                      {tx.dispute.reason}
                    </p>
                  ) : null}
                </>
              ) : tx?.status === "completed" && tx.payout ? (
                <>
                  <p className="text-[16px] leading-6 text-[oklch(0.28_0.04_55)]">
                    Order completed. {formatAed(tx.payout.seller_share)} dispatched
                    to the seller’s wallet
                    {tx.payout.is_consignment
                      ? `, ${formatAed(tx.payout.concierge_share)} to Closet Detox.`
                      : "."}
                  </p>
                  <p className="mt-2 text-[12px] leading-4 text-[oklch(0.5_0.025_55)]">
                    Demonstration payout — not a live transfer.
                  </p>
                </>
              ) : inspectionOpen ? (
                <>
                  <AutoReleaseClock remainingMs={remainingMs} />
                  <p className="mt-3 text-[16px] leading-6 tabular-nums text-[oklch(0.22_0.025_55)]">
                    {formatAutoReleaseCopy(remainingMs)}
                  </p>
                  <p className="mt-2 max-w-[40ch] text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
                    {INSPECTION_HOURS}-hour window from delivery. Accept now, or
                    funds release on their own.
                  </p>
                  <button
                    type="button"
                    onClick={acceptOrder}
                    disabled={releasing}
                    className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-[oklch(0.48_0.12_52)] text-[14px] font-semibold text-[oklch(0.98_0.012_85)] transition-colors duration-200 hover:bg-[oklch(0.42_0.12_52)] disabled:bg-[oklch(0.82_0.02_72)] disabled:text-[oklch(0.5_0.02_55)]"
                    style={{ transitionTimingFunction: EASE }}
                  >
                    {releasing ? "Releasing funds…" : "Accept Order & Release Funds"}
                  </button>
                  <p className="mt-2 max-w-[42ch] text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
                    Clicking this confirms the item is authentic and in described
                    condition, instantly releasing payment to the seller
                  </p>
                  <button
                    type="button"
                    onClick={() => setDisputeOpen(true)}
                    className="mt-4 flex h-12 w-full items-center justify-center rounded-full border border-[oklch(0.84_0.02_75)] bg-[#F9F6F0] text-[14px] font-semibold text-[oklch(0.22_0.025_55)]"
                  >
                    Report Issue / Open Dispute
                  </button>
                </>
              ) : null}
            </section>
          ) : null}
        </div>
      )}
      {disputeOpen ? (
        <DisputeSheet
          onClose={() => setDisputeOpen(false)}
          onSubmit={submitDispute}
        />
      ) : null}
      <AppDock />
    </main>
  );
}

function AutoReleaseClock({ remainingMs }: { remainingMs: number }) {
  const progress = remainingMs / AUTO_RELEASE_MS;
  const radius = 18;
  const circ = 2 * Math.PI * radius;
  const dash = circ * progress;

  return (
    <div className="flex items-center gap-3">
      <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" className="-rotate-90">
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="oklch(0.9 0.015 80)"
          strokeWidth="3.5"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="oklch(0.28 0.03 55)"
          strokeWidth="3.5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div>
        <p className="font-[family-name:var(--font-display)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.22_0.025_55)] tabular-nums">
          {formatClockDigits(remainingMs)}
        </p>
        <p className="mt-1 text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
          until auto-release
        </p>
      </div>
    </div>
  );
}

function DisputeSheet({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("Not as described");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reason.trim() || sending) return;
    setSending(true);
    onSubmit(reason.trim(), details.trim());
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 z-50 m-0 hidden h-dvh max-h-dvh w-full max-w-none border-0 bg-transparent p-0 open:grid open:place-items-end open:sm:place-items-center [&::backdrop]:bg-[oklch(0.22_0.02_55/0.46)]"
    >
      <button
        type="button"
        aria-label="Dismiss dispute"
        className="absolute inset-0 cursor-default bg-transparent"
        onClick={onClose}
        tabIndex={-1}
      />
      <form
        onSubmit={submit}
        className="relative z-10 w-full overflow-y-auto rounded-t-[1.75rem] border border-[oklch(0.88_0.018_80)] bg-[#F9F6F0] px-5 pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] motion-safe:animate-[sheet-up_220ms_cubic-bezier(0.16,1,0.3,1)_both] sm:mx-auto sm:max-w-[26.5rem] sm:rounded-[1.75rem]"
      >
        <h2 className="font-[family-name:var(--font-display)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.22_0.025_55)]">
          Report an issue
        </h2>
        <p className="mt-4 max-w-[40ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
          This freezes the 12-hour clock. Escrow stays held until support reviews.
        </p>
        <fieldset className="mt-6">
          <legend className="text-[14px] font-semibold leading-5 text-[oklch(0.22_0.025_55)]">
            What happened
          </legend>
          <div className="mt-2 flex flex-col">
            {["Not as described", "Authenticity concern", "Damaged in transit", "Other"].map(
              (option) => (
                <label
                  key={option}
                  className={`flex h-11 items-center rounded-[0.85rem] px-2 text-[16px] ${
                    reason === option
                      ? "bg-[oklch(0.96_0.01_82)] font-semibold text-[oklch(0.22_0.025_55)]"
                      : "text-[oklch(0.38_0.03_55)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="dispute-reason"
                    value={option}
                    checked={reason === option}
                    onChange={() => setReason(option)}
                    className="sr-only"
                  />
                  {option}
                </label>
              ),
            )}
          </div>
        </fieldset>
        <label htmlFor="dispute-details" className="mt-5 block text-[14px] leading-5 text-[oklch(0.22_0.025_55)]">
          Details
        </label>
        <textarea
          id="dispute-details"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          rows={4}
          className="mt-1.5 w-full resize-none rounded-2xl border border-[oklch(0.88_0.018_80)] bg-[#F9F6F0] px-3.5 py-3 text-[16px] text-[oklch(0.22_0.025_55)] outline-none focus:border-[oklch(0.48_0.12_52)]"
        />
        <button
          type="submit"
          disabled={sending}
          className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-[oklch(0.48_0.12_52)] text-[14px] font-semibold text-[oklch(0.98_0.012_85)] disabled:bg-[oklch(0.82_0.02_72)] disabled:text-[oklch(0.5_0.02_55)]"
        >
          {sending ? "Submitting…" : "Submit dispute"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 flex h-12 w-full items-center justify-center rounded-full text-[14px] font-semibold text-[oklch(0.22_0.025_55)]"
        >
          Cancel
        </button>
      </form>
    </dialog>
  );
}

function EscrowBanner() {
  return (
    <aside className="rounded-[1.35rem] bg-[oklch(0.945_0.025_70)] px-4 py-4">
      <p className="max-w-[42ch] text-[16px] leading-6 text-[oklch(0.28_0.04_50)]">
        {ESCROW_WARNING}
      </p>
    </aside>
  );
}

function ListingStrip({ listing }: { listing: Listing }) {
  const meta = [listing.size, listing.condition].filter(Boolean).join(" · ");
  return (
    <div className="mt-6 flex items-center gap-3.5">
      {listing.original_photo_url ? (
        <img
          src={listing.original_photo_url}
          alt=""
          className="size-[4.25rem] shrink-0 rounded-2xl object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="grid size-[4.25rem] shrink-0 place-items-center rounded-2xl bg-[oklch(0.93_0.02_75)] font-[family-name:var(--font-display)] text-[22px] text-[oklch(0.38_0.05_52)]"
        >
          {listing.brand.slice(0, 1)}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate font-[family-name:var(--font-display)] text-[20px] leading-7 text-[oklch(0.22_0.025_55)]">
          {listing.brand}
        </p>
        <p className="truncate text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
          {listing.title}
          {meta ? ` · ${meta}` : ""}
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <dt className="text-[14px] leading-5 text-[oklch(0.22_0.025_55)]">{label}</dt>
        {hint ? (
          <p className="mt-0.5 max-w-[28ch] text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
            {hint}
          </p>
        ) : null}
      </div>
      <dd className="shrink-0 text-[14px] leading-5 tabular-nums text-[oklch(0.22_0.025_55)]">
        {value}
      </dd>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  inputMode,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  inputMode?: "numeric";
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[14px] leading-5 text-[oklch(0.22_0.025_55)]">
        {label}
      </label>
      <input
        id={id}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1.5 h-12 w-full rounded-2xl border bg-[#F9F6F0] px-3.5 text-[16px] tabular-nums text-[oklch(0.22_0.025_55)] outline-none placeholder:text-[oklch(0.5_0.025_55)] focus:border-[oklch(0.48_0.12_52)] ${
          error ? "border-[oklch(0.62_0.1_40)]" : "border-[oklch(0.88_0.018_80)]"
        }`}
      />
      {error ? (
        <p role="alert" className="mt-1.5 text-[14px] leading-5 text-[oklch(0.42_0.1_40)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function validateCard(card: CardFields): FieldErrors {
  const errors: FieldErrors = {};
  if (!card.name.trim()) errors.name = "Enter the name as it appears on the card.";
  const digits = card.number.replace(/\s/g, "");
  if (digits.length !== 16) {
    errors.number = "Enter a 16-digit card number to simulate Mamo Pay.";
  }
  if (!/^(0[1-9]|1[0-2])\s\/\s\d{2}$/.test(card.expiry)) {
    errors.expiry = "Use MM / YY.";
  }
  if (card.cvc.length < 3) errors.cvc = "Enter the 3 or 4-digit CVC.";
  return errors;
}

function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

function formatClockDigits(ms: number): string {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}
