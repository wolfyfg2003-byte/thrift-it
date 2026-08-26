"use client";

import OfferModal from "@/components/OfferModal";
import { formatAed, quoteCheckout } from "@/lib/checkout";
import type { Listing } from "@/lib/listings";
import Link from "next/link";
import { useMemo, useState } from "react";

const GOLD = "#2A1A14";
const EASE = "cubic-bezier(0.19, 1, 0.22, 1)";

type TransactionSidebarProps = {
  listing: Listing;
};

export function TransactionSidebar({ listing }: TransactionSidebarProps) {
  const [openQuote, setOpenQuote] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const quote = useMemo(() => quoteCheckout(listing.price), [listing.price]);

  return (
    <aside className="lg:col-span-5 lg:sticky lg:top-[5.5rem] lg:self-start">
      <p className="font-[family-name:var(--font-handwritten)] text-[14px] text-[#6B4A3A]">
        {listing.brand}
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-typewriter)] text-[28px] leading-none text-[#2A1A14]">
        {listing.title}
      </h1>

      <div className="mt-8 border-b border-[#E5D9C4] pb-6">
        <button
          type="button"
          aria-expanded={openQuote}
          onClick={() => setOpenQuote((on) => !on)}
          className="flex w-full items-baseline justify-between gap-4 text-left"
        >
          <span className="font-[family-name:var(--font-handwritten)] text-[22px] tabular-nums text-[#2A1A14]">
            {formatAed(listing.price)}
          </span>
          <span className="text-[14px] font-medium text-[#4B6584]">
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
                <dt className="text-[#6B4A3A]">List price</dt>
                <dd className="tabular-nums text-[#2A1A14]">
                  {formatAed(quote.item_price)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#6B4A3A]">
                  Buyer protection fee (20%)
                </dt>
                <dd className="tabular-nums text-[#2A1A14]">
                  {formatAed(quote.buyer_protection_fee)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#6B4A3A]">
                  Courier delivery (flat)
                </dt>
                <dd className="tabular-nums text-[#2A1A14]">
                  {formatAed(quote.shipping_fee)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-[#E5D9C4] pt-3">
                <dt className="font-semibold text-[#2A1A14]">
                  Total
                </dt>
                <dd className="font-semibold tabular-nums text-[#2A1A14]">
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
        <p className="mt-8 max-w-[36ch] text-[16px] leading-6 text-[#6B4A3A]">
          {listing.description}
        </p>
      ) : null}

      <div className="mt-10 flex flex-col gap-3">
        <Link
          href={`/checkout/${listing.id}`}
          className="flex h-12 items-center justify-center border border-[#2A1A14] bg-[#D8829D] text-[14px] font-semibold tracking-[-0.01em] text-[#2A1A14] shadow-[4px_4px_0_0_#2A1A14]"
          style={{ transitionTimingFunction: EASE }}
        >
          Buy Now
        </Link>
        <button
          type="button"
          onClick={() => setOfferOpen(true)}
          className="flex h-12 items-center justify-center border border-[#2A1A14] bg-[#F4EFE6] text-[14px] font-semibold tracking-[-0.01em] text-[#2A1A14] shadow-[3px_3px_0_0_#2A1A14]"
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
      <dt className="font-[family-name:var(--font-handwritten)] text-[12px] leading-4 text-[#6B4A3A]">
        {label}
      </dt>
      <dd className="mt-1 font-[family-name:var(--font-typewriter)] text-[16px] leading-6 text-[#2A1A14]">
        {value}
      </dd>
    </div>
  );
}
