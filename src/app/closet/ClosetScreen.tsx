"use client";

import AppDock from "@/components/AppDock";
import BoostSheet from "@/components/BoostSheet";
import { formatAed } from "@/lib/checkout";
import type { Listing } from "@/lib/listings";
import {
  BOOST_AED,
  BOOST_HOURS,
  boostExpiresAt,
  openBoostCheckout,
  usePlusState,
} from "@/lib/plus-store";
import Link from "next/link";
import { useEffect, useState } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function ClosetScreen({ listings }: { listings: Listing[] }) {
  const plus = usePlusState();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(tick);
  }, []);

  const wardrobe = listings.filter((item) => item.escrow_status === "none");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[28rem] flex-col bg-[#FDFBF7] px-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-[family-name:var(--font-bodoni)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.22_0.025_55)]">
          Closet
        </h1>
        <Link
          href="/settings"
          className="mt-1 flex h-10 items-center gap-2 rounded-full px-1 text-[14px] font-semibold text-[oklch(0.22_0.025_55)]"
        >
          <SettingsIcon />
          Settings
        </Link>
      </div>
      <p className="mt-3 max-w-[40ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
        Your listings. Boost one to the front of every buyer’s deck for {BOOST_HOURS}{" "}
        hours.
      </p>
      <p className="mt-2 text-[12px] leading-4 text-[oklch(0.5_0.025_55)]">
        Demonstration wardrobe — not live inventory.
      </p>

      {plus.plusActive ? (
        <p className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-[oklch(0.93_0.018_72)] px-3 py-1.5 text-[12px] leading-4 text-[oklch(0.32_0.04_52)]">
          <VerifyIcon />
          Verify Profile
        </p>
      ) : null}

      <ul className="mt-2">
        {wardrobe.map((item) => {
          const until = boostExpiresAt(item.id, now);
          const hoursLeft = until ? Math.max(1, Math.ceil((until - now) / 3_600_000)) : 0;
          return (
            <li key={item.id} className="border-b border-[oklch(0.88_0.018_80)]">
              <button
                type="button"
                onClick={() => {
                  if (!until) openBoostCheckout(item.id);
                }}
                disabled={Boolean(until)}
                className="flex w-full items-start gap-3.5 py-6 text-left transition-colors duration-200 hover:bg-[oklch(0.97_0.008_82)] disabled:hover:bg-transparent"
                style={{ transitionTimingFunction: EASE }}
              >
                {item.original_photo_url ? (
                  <img
                    src={item.original_photo_url}
                    alt=""
                    className="size-16 shrink-0 rounded-[0.85rem] border border-[oklch(0.88_0.018_80)] object-cover"
                  />
                ) : (
                  <span className="grid size-16 shrink-0 place-items-center rounded-[0.85rem] border border-[oklch(0.88_0.018_80)] bg-[oklch(0.93_0.02_75)] font-[family-name:var(--font-bodoni)] text-[16px] text-[oklch(0.38_0.05_52)]">
                    {item.brand.slice(0, 1)}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
                    {item.brand}
                  </span>
                  <span className="mt-0.5 block truncate text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
                    {item.title} · {formatAed(item.price)}
                  </span>
                  {until ? (
                    <span className="mt-2 block text-[12px] leading-4 text-[oklch(0.38_0.04_52)]">
                      Boosted · {hoursLeft}h at the front of the deck
                    </span>
                  ) : (
                    <span className="mt-3 inline-flex h-10 items-center rounded-full border border-[oklch(0.84_0.02_75)] px-4 text-[14px] font-semibold text-[oklch(0.22_0.025_55)]">
                      Boost · {formatAed(BOOST_AED)}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <Link
        href="/sell"
        className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[oklch(0.48_0.12_52)] px-6 text-[14px] font-semibold text-[oklch(0.98_0.012_85)]"
      >
        Upload a piece
      </Link>
      <Link
        href="/dashboard/vip"
        className="mt-4 text-[14px] font-semibold text-[oklch(0.22_0.025_55)] underline decoration-[oklch(0.48_0.12_52)] underline-offset-2"
      >
        Open VIP Closet Detox
      </Link>

      <BoostSheet listings={wardrobe} />
      <AppDock />
    </main>
  );
}

function VerifyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M4 7.1 6.1 9.2 10 5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="2.1" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 2.2v1.3M8 12.5v1.3M2.2 8h1.3M12.5 8h1.3M3.9 3.9l.95.95M11.15 11.15l.95.95M12.1 3.9l-.95.95M4.85 11.15l-.95.95"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
