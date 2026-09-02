"use client";

import { formatAed } from "@/lib/checkout";
import { toggleFollow, useIsFollowing } from "@/lib/follow-store";
import type { Listing } from "@/lib/listings";
import { formatFollowers, type SellerProfile } from "@/lib/sellers";
import Link from "next/link";
import { useState } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function SellerProfileScreen({
  seller,
  listings,
}: {
  seller: SellerProfile;
  listings: Listing[];
}) {
  const following = useIsFollowing(seller.username);
  const [tab, setTab] = useState<"closet" | "reviews">("closet");
  const followerLabel = following
    ? formatFollowers(seller.followers + 1)
    : formatFollowers(seller.followers);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[28rem] bg-[#F9F6F0] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.85rem,env(safe-area-inset-top))]">
      <Link
        href="/"
        className="inline-flex h-10 items-center text-[14px] font-semibold text-[oklch(0.22_0.025_55)]"
      >
        <BackIcon />
        <span className="ml-1">Deck</span>
      </Link>

      <header className="mt-4">
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="grid size-16 shrink-0 place-items-center rounded-full bg-[oklch(0.93_0.03_75)] font-[family-name:var(--font-display)] text-[20px] text-[oklch(0.32_0.05_52)]"
          >
            {seller.initials}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate py-[0.12em] font-[family-name:var(--font-display)] text-[32px] leading-[1.2] tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
              {seller.handle}
            </h1>
            <p className="mt-2 text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
              {seller.location}
            </p>
            <p className="mt-1 text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
              {followerLabel} followers
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-[12px] leading-4 text-[oklch(0.32_0.05_52)]">
              <StarIcon />
              {seller.rating.toFixed(1)} from {seller.reviewCount} reviews
            </p>
          </div>
        </div>

        <p className="mt-4 max-w-[40ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
          {seller.bio}
        </p>
        <p className="mt-2 text-[12px] leading-4 text-[oklch(0.5_0.025_55)]">
          Demonstration closet — not live followers or reviews.
        </p>

        <button
          type="button"
          onClick={() => toggleFollow(seller.username)}
          aria-pressed={following}
          className={`mt-6 flex h-12 w-full items-center justify-center rounded-full text-[14px] font-semibold transition-colors duration-200 ${
            following
              ? "border border-[oklch(0.78_0.04_72)] bg-[#F9F6F0] text-[oklch(0.32_0.05_52)] hover:bg-[oklch(0.96_0.012_82)]"
              : "bg-[oklch(0.52_0.14_72)] text-[oklch(0.98_0.012_85)] hover:bg-[oklch(0.46_0.13_72)]"
          }`}
          style={{ transitionTimingFunction: EASE }}
        >
          {following ? "Following" : "Follow Closet"}
        </button>
      </header>

      <div
        role="tablist"
        aria-label="Seller profile"
        className="mt-8 grid grid-cols-2 rounded-full bg-[oklch(0.96_0.01_82)] p-1"
      >
        <TabButton selected={tab === "closet"} onClick={() => setTab("closet")}>
          Closet
        </TabButton>
        <TabButton selected={tab === "reviews"} onClick={() => setTab("reviews")}>
          Reviews
        </TabButton>
      </div>

      {tab === "closet" ? (
        listings.length === 0 ? (
          <p className="mt-8 max-w-[36ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
            Nothing on the rail right now.
          </p>
        ) : (
          <div className="mt-6">
            {listings[0] ? (
              <Link href={`/checkout/${listings[0].id}`} className="block">
                {listings[0].original_photo_url ? (
                  <img
                    src={listings[0].original_photo_url}
                    alt=""
                    className="aspect-[3/4] w-full rounded-[1.25rem] border border-[oklch(0.88_0.018_80)] object-cover"
                  />
                ) : null}
                <p className="mt-3 text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
                  {listings[0].brand}
                </p>
                <p className="mt-1 text-[16px] font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
                  {listings[0].title}
                </p>
                <p className="mt-1 text-[14px] tabular-nums text-[oklch(0.22_0.025_55)]">
                  {formatAed(listings[0].price)}
                </p>
              </Link>
            ) : null}

            {listings.length > 1 ? (
              <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6">
                {listings.slice(1).map((item) => (
                  <li key={item.id}>
                    <Link href={`/checkout/${item.id}`} className="block">
                      {item.original_photo_url ? (
                        <img
                          src={item.original_photo_url}
                          alt=""
                          className="aspect-[3/4] w-full rounded-[1.05rem] border border-[oklch(0.88_0.018_80)] object-cover"
                        />
                      ) : (
                        <span className="block aspect-[3/4] rounded-[1.05rem] bg-[oklch(0.93_0.02_75)]" />
                      )}
                      <p className="mt-2 truncate text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
                        {item.brand}
                      </p>
                      <p className="mt-0.5 truncate text-[14px] font-semibold text-[oklch(0.22_0.025_55)]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[12px] tabular-nums text-[oklch(0.22_0.025_55)]">
                        {formatAed(item.price)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )
      ) : (
        <ul className="mt-2">
          {seller.reviews.map((review) => (
            <li
              key={review.id}
              className="border-b border-[oklch(0.88_0.018_80)] py-6"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[16px] font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
                  {review.buyerHandle}
                </p>
                <p className="flex items-center gap-1 text-[12px] leading-4 text-[oklch(0.32_0.05_52)]">
                  <StarIcon />
                  {review.rating.toFixed(1)}
                  <span className="text-[oklch(0.5_0.025_55)]">· {review.date}</span>
                </p>
              </div>
              <p className="mt-2 max-w-[42ch] text-[16px] leading-6 text-[oklch(0.38_0.03_55)]">
                {review.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function TabButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`h-10 rounded-full text-[14px] transition-colors duration-200 ${
        selected
          ? "bg-[#F9F6F0] font-semibold text-[oklch(0.22_0.025_55)] shadow-[0_6px_16px_-10px_oklch(0.22_0.03_55/0.35)]"
          : "font-medium text-[oklch(0.5_0.03_55)]"
      }`}
      style={{ transitionTimingFunction: EASE }}
    >
      {children}
    </button>
  );
}

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M6 1.2 7.3 4.3l3.4.3-2.6 2.2.8 3.3L6 8.4 3.1 10.1l.8-3.3L1.3 4.6l3.4-.3L6 1.2Z"
        fill="oklch(0.52 0.14 72)"
      />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M10.2 3.2 5.2 8l5 4.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
