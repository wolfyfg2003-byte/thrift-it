"use client";

import AppDock from "@/components/AppDock";
import { formatAed } from "@/lib/checkout";
import { sellerPayout } from "@/lib/payout";
import Link from "next/link";
import { useMemo, useState } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const LISTED_PRICE = 2400;
const SOLD_PRICE = 450;

const INVENTORY = [
  {
    id: "zimmermann-floral",
    label: "Zimmermann Floral Maxi",
    status: "listed" as const,
  },
  {
    id: "self-portrait-boucle",
    label: "Self-Portrait Bouclé Dress",
    status: "studio" as const,
  },
  {
    id: "house-of-cb",
    label: "House of CB Dress",
    status: "sold" as const,
  },
];

export default function VipClosetDashboard() {
  const sold = useMemo(() => sellerPayout(SOLD_PRICE, true), []);
  const [pickup, setPickup] = useState<"idle" | "booked">("idle");

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[28rem] bg-[#F9F6F0] px-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[max(1.75rem,env(safe-area-inset-top))]">
      <header className="max-w-[40ch]">
        <h1 className="font-[family-name:var(--font-display)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.22_0.025_55)]">
          Closet
        </h1>
        <p className="mt-3 text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
          Thrift It photographs, authenticates, lists, and stores the detox.
          You keep half of every sale.
        </p>
        <p className="mt-2 text-[12px] leading-4 text-[oklch(0.5_0.025_55)]">
          Demonstration wardrobe — not live earnings.
        </p>
      </header>

      <section
        aria-label="Earnings"
        className="mt-12 grid grid-cols-3 gap-4 border-y border-[oklch(0.88_0.018_80)] py-7"
      >
        <Metric label="Total earnings" value={formatAed(sold.seller_share)} />
        <Metric label="Active listings" value={formatAed(LISTED_PRICE)} />
        <Metric label="Items sold" value="1" />
      </section>

      <section className="mt-12">
        <h2 className="text-[20px] leading-7 font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
          In our care
        </h2>
        <ul className="mt-2">
          {INVENTORY.map((item) => (
            <li
              key={item.id}
              className="border-b border-[oklch(0.88_0.018_80)] py-7"
            >
              <p className="font-[family-name:var(--font-display)] text-[20px] leading-7 text-[oklch(0.22_0.025_55)]">
                {item.label}
              </p>
              {item.status === "listed" ? (
                <p className="mt-2 text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
                  Listed at {formatAed(LISTED_PRICE)}.{" "}
                  <Link
                    href={`/checkout/${item.id}`}
                    className="font-semibold text-[oklch(0.22_0.025_55)] underline decoration-[oklch(0.48_0.12_52)] underline-offset-2"
                  >
                    View public listing
                  </Link>
                </p>
              ) : null}
              {item.status === "studio" ? (
                <p className="mt-2 max-w-[38ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
                  At Al Quoz Warehouse — in the photography and authentication
                  studio.
                </p>
              ) : null}
              {item.status === "sold" ? (
                <p className="mt-2 max-w-[40ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
                  Sold. 50/50 split: {formatAed(sold.seller_share)} to you /{" "}
                  {formatAed(sold.concierge_share)} to Thrift It.
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        {pickup === "booked" ? (
          <p
            role="status"
            className="max-w-[42ch] text-[16px] leading-6 text-[oklch(0.22_0.025_55)]"
          >
            AJEX is booked. A driver will collect the next batch from your
            Dubai address — prepaid label, no meetup.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setPickup("booked")}
            className="flex h-12 w-full items-center justify-center rounded-full bg-[oklch(0.48_0.12_52)] text-[14px] font-semibold tracking-[-0.01em] text-[oklch(0.98_0.012_85)] transition-colors duration-200 hover:bg-[oklch(0.42_0.12_52)] active:bg-[oklch(0.38_0.11_52)]"
            style={{ transitionTimingFunction: EASE }}
          >
            Schedule a home pickup
          </button>
        )}
      </section>

      <AppDock />
    </main>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-[20px] leading-7 tracking-[-0.02em] text-[oklch(0.22_0.025_55)] tabular-nums">
        {value}
      </p>
    </div>
  );
}
