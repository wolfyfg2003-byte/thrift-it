"use client";

import OfferModal from "@/components/OfferModal";
import { formatAed, quoteCheckout } from "@/lib/checkout";
import type { Listing } from "@/lib/listings";
import Link from "next/link";
import { useMemo, useState } from "react";

const GOLD = "#E5D9C4";
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

type TransactionSidebarProps = {
  listing: Listing;
};

export function TransactionSidebar({ listing }: TransactionSidebarProps) {
  const [openQuote, setOpenQuote] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const quote = useMemo(() => quoteCheckout(listing.price), [listing.price]);

  return (
    <aside className="lg:col-span-5 lg:sticky lg:top-[5.5rem] lg:self-start">
      <p className="text-[12px] font-semibold tracking-[0.18em] text-[oklch(0.42_0.03_55)] uppercase">
        {listing.brand}
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-bodoni)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.22_0.025_55)]">
        {listing.title}
      </h1>

      <div className="mt-8 border-b border-[#E5D9C4] pb-6">
        <button
          type="button"
          aria-expanded={openQuote}
          onClick={() => setOpenQuote((on) => !on)}
          className="flex w-full items-baseline justify-between gap-4 text-left"
        >
          <span className="text-[20px] font-semibold tabular-nums text-[oklch(0.22_0.025_55)]">
            {formatAed(listing.price)}
          </span>
          <span className="text-[14px] font-medium text-[oklch(0.48_0.12_52)]">
            {openQuote ? "Hide total" : "See total"}
          </span>
        </button>
        <div
          className="grid transition-[grid-template-rows] duration-300"
          style={{
            gridTemplateRows: openQuote ? "1fr" : "0fr",
            transitionTimingFunction: EASE,
          }}
        >
          <div className="overflow-hidden">
            <dl className="mt-5 space-y-3 text-[14px] leading-5">
              <div className="flex justify-between gap-4">
                <dt className="text-[oklch(0.42_0.03_55)]">List price</dt>
                <dd className="tabular-nums text-[oklch(0.22_0.025_55)]">
                  {formatAed(quote.item_price)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[oklch(0.42_0.03_55)]">
                  Buyer protection fee (20%)
                </dt>
                <dd className="tabular-nums text-[oklch(0.22_0.025_55)]">
                  {formatAed(quote.buyer_protection_fee)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[oklch(0.42_0.03_55)]">
                  Courier delivery (flat)
                </dt>
                <dd className="tabular-nums text-[oklch(0.22_0.025_55)]">
                  {formatAed(quote.shipping_fee)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-[#E5D9C4] pt-3">
                <dt className="font-semibold text-[oklch(0.22_0.025_55)]">
                  Total
                </dt>
                <dd className="font-semibold tabular-nums text-[oklch(0.22_0.025_55)]">
                  {formatAed(quote.total_charge)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5">
        <Meta label="Size" value={listing.size} />
        <Meta label="Condition" value={listing.condition} />
        <Meta label="Material" value={listing.material} />
        <Meta label="Location" value={listing.location} />
      </dl>

      {listing.description ? (
        <p className="mt-8 max-w-[36ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
          {listing.description}
        </p>
      ) : null}

      <div className="mt-10 flex flex-col gap-3">
        <Link
          href={`/checkout/${listing.id}`}
          className="flex h-12 items-center justify-center rounded-full bg-[oklch(0.22_0.025_55)] text-[14px] font-semibold tracking-[-0.01em] text-[#FDFBF7] transition-colors duration-200 hover:text-[oklch(0.82_0.1_78)]"
          style={{ transitionTimingFunction: EASE }}
        >
          Buy Now
        </Link>
        <button
          type="button"
          onClick={() => setOfferOpen(true)}
          className="flex h-12 items-center justify-center rounded-full border bg-[#FDFBF7] text-[14px] font-semibold tracking-[-0.01em] text-[oklch(0.22_0.025_55)] transition-colors duration-200 hover:bg-[oklch(0.97_0.012_82)]"
          style={{ borderColor: GOLD, transitionTimingFunction: EASE }}
        >
          Make an Offer
        </button>
      </div>

      {offerOpen ? (
        <OfferModal
          open={offerOpen}
          listing={listing}
          onClose={() => setOfferOpen(false)}
        />
      ) : null}
    </aside>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12px] leading-4 text-[oklch(0.5_0.02_55)]">{label}</dt>
      <dd className="mt-1 text-[16px] leading-6 text-[oklch(0.22_0.025_55)]">
        {value}
      </dd>
    </div>
  );
}
