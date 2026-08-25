"use client";

import AppDock from "@/components/AppDock";
import { SparkleIcon } from "@/components/PlusPaywall";
import { formatAed } from "@/lib/checkout";
import { useFollowState } from "@/lib/follow-store";
import type { Listing } from "@/lib/listings";
import { formatSizeKeyLabel } from "@/lib/filters";
import { restorePlus, usePlusState } from "@/lib/plus-store";
import { restoreProfile, useProfile } from "@/lib/profile-store";
import { BUYER_PROFILE } from "@/lib/user-profile";
import Link from "next/link";
import { useEffect, useState } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function ProfileScreen({ listings }: { listings: Listing[] }) {
  const plus = usePlusState();
  const profile = useProfile();
  const follows = useFollowState();
  const [tab, setTab] = useState<"gems" | "reviews">("gems");

  useEffect(() => {
    restorePlus();
    restoreProfile();
  }, []);

  const liked = BUYER_PROFILE.likedListingIds
    .map((id) => listings.find((item) => item.id === id))
    .filter((item): item is Listing => Boolean(item));
  const featured = liked[0];
  const rest = liked.slice(1);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[28rem] flex-col bg-[#FDFBF7] px-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[max(0.85rem,env(safe-area-inset-top))]">
      <header className="relative motion-safe:animate-[profile-in_520ms_cubic-bezier(0.16,1,0.3,1)_both]">
        <Link
          href="/settings"
          aria-label="Edit Settings"
          className="absolute top-0 right-0 grid size-11 place-items-center rounded-full text-[oklch(0.22_0.025_55)]"
        >
          <SettingsIcon />
        </Link>

        <div className="pr-12">
          <span
            className={`block size-[6.75rem] overflow-hidden rounded-full ${
              plus.plusActive
                ? "ring-1 ring-[oklch(0.72_0.08_72)] ring-offset-2 ring-offset-[#FDFBF7]"
                : "border border-[oklch(0.86_0.02_80)]"
            }`}
          >
            <img
              src={BUYER_PROFILE.portraitUrl}
              alt=""
              className="size-full object-cover"
            />
          </span>

          <h1 className="mt-5 py-[0.12em] font-[family-name:var(--font-bodoni)] text-[32px] leading-[1.2] tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
            {BUYER_PROFILE.handle}
          </h1>

          {plus.plusActive ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.72_0.08_72)] bg-[oklch(0.93_0.04_72)] px-3 py-1.5 text-[12px] leading-4 font-semibold text-[oklch(0.36_0.08_52)]">
              <SparkleIcon />
              Thrift It Plus
            </p>
          ) : null}

          <p className="mt-2 text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
            {profile.address.community || BUYER_PROFILE.location}
          </p>
        </div>
      </header>

      <dl className="mt-8 flex items-end gap-4 border-y border-[oklch(0.88_0.018_80)] py-6">
        <div className="min-w-0 flex-[1.15]">
          <dt className="text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
            Wardrobes Detoxed
          </dt>
          <dd className="mt-2 font-[family-name:var(--font-bodoni)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.22_0.025_55)] tabular-nums">
            {BUYER_PROFILE.wardrobesDetoxed}
          </dd>
        </div>
        <div
          aria-hidden="true"
          className="mb-1 h-9 w-px shrink-0 bg-[oklch(0.88_0.018_80)]"
        />
        <div className="min-w-0 flex-1">
          <dt className="text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">Gems Saved</dt>
          <dd className="mt-2 font-[family-name:var(--font-bodoni)] text-[24px] leading-none tracking-[-0.02em] text-[oklch(0.22_0.025_55)] tabular-nums">
            {BUYER_PROFILE.gemsSaved}
          </dd>
        </div>
        <div
          aria-hidden="true"
          className="mb-1 h-9 w-px shrink-0 bg-[oklch(0.88_0.018_80)]"
        />
        <div className="min-w-0 flex-1">
          <dt className="text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">Following</dt>
          <dd className="mt-2 font-[family-name:var(--font-bodoni)] text-[24px] leading-none tracking-[-0.02em] text-[oklch(0.22_0.025_55)] tabular-nums">
            {follows.usernames.length}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-[12px] leading-4 text-[oklch(0.5_0.025_55)]">
        Demonstration closet — sold, saved, and review counts are not live.
      </p>

      <section className="mt-9">
        <h2 className="font-[family-name:var(--font-bodoni)] text-[20px] leading-7 tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
          Buyer note
        </h2>
        <p className="mt-3 max-w-[40ch] text-[16px] leading-6 text-[oklch(0.38_0.03_55)]">
          {BUYER_PROFILE.bio}
        </p>

        <ul className="mt-5 flex flex-wrap gap-2">
          {BUYER_PROFILE.styleTags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-[oklch(0.84_0.02_75)] px-3 py-1.5 text-[12px] leading-4 text-[oklch(0.32_0.04_52)]"
            >
              {tag}
            </li>
          ))}
        </ul>

        <dl className="mt-6 flex gap-10">
          <div>
            <dt className="text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">Dress</dt>
            <dd className="mt-1 text-[16px] leading-6 font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
              {formatSizeKeyLabel(profile.dressSizeKey)}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">Shoes</dt>
            <dd className="mt-1 text-[16px] leading-6 font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
              {BUYER_PROFILE.shoeSize}
            </dd>
          </div>
        </dl>
      </section>

      <div
        role="tablist"
        aria-label="Your profile"
        className="mt-10 grid grid-cols-2 rounded-full border border-[oklch(0.86_0.02_80)] p-1"
      >
        <TabButton selected={tab === "gems"} onClick={() => setTab("gems")}>
          My Liked Gems
        </TabButton>
        <TabButton selected={tab === "reviews"} onClick={() => setTab("reviews")}>
          My Reviews
        </TabButton>
      </div>

      {tab === "gems" ? (
        liked.length === 0 ? (
          <p className="mt-8 max-w-[36ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
            Nothing saved yet. Swipe right on the deck.
          </p>
        ) : (
          <div className="mt-6">
            {featured ? <LikedGem item={featured} featured /> : null}
            {rest.length > 0 ? (
              <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6">
                {rest.map((item) => (
                  <li key={item.id}>
                    <LikedGem item={item} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )
      ) : (
        <ul className="mt-2">
          {BUYER_PROFILE.sellerReviews.map((review) => (
            <li
              key={review.id}
              className="border-b border-[oklch(0.88_0.018_80)] py-6"
            >
              <div className="flex items-baseline justify-between gap-3">
                <Link
                  href={`/seller/${review.sellerUsername}`}
                  className="text-[16px] font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]"
                >
                  {review.sellerHandle}
                </Link>
                <p className="shrink-0 text-[12px] leading-4 text-[oklch(0.5_0.025_55)]">
                  {review.date}
                </p>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <StarRow rating={review.rating} />
                <p className="text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
                  {review.listingTitle}
                </p>
              </div>
              <p className="mt-2 max-w-[42ch] text-[16px] leading-6 text-[oklch(0.38_0.03_55)]">
                {review.body}
              </p>
            </li>
          ))}
        </ul>
      )}

      <AppDock />
    </main>
  );
}

function LikedGem({ item, featured = false }: { item: Listing; featured?: boolean }) {
  return (
    <Link href={`/checkout/${item.id}`} className="block">
      {item.original_photo_url ? (
        <img
          src={item.original_photo_url}
          alt=""
          className={`w-full border border-[oklch(0.88_0.018_80)] object-cover ${
            featured
              ? "aspect-[3/4] rounded-[1.25rem]"
              : "aspect-[3/4] rounded-[1.05rem]"
          }`}
        />
      ) : (
        <span
          className={`block bg-[oklch(0.93_0.02_75)] ${
            featured
              ? "aspect-[3/4] rounded-[1.25rem]"
              : "aspect-[3/4] rounded-[1.05rem]"
          }`}
        />
      )}
      <p
        className={`leading-4 text-[oklch(0.42_0.03_55)] ${
          featured ? "mt-3 text-[12px]" : "mt-2 truncate text-[12px]"
        }`}
      >
        {item.brand}
      </p>
      <p
        className={`tracking-[-0.02em] text-[oklch(0.22_0.025_55)] ${
          featured
            ? "mt-1 text-[16px] font-semibold"
            : "mt-0.5 truncate text-[14px] font-semibold"
        }`}
      >
        {item.title}
      </p>
      <p
        className={`tabular-nums text-[oklch(0.22_0.025_55)] ${
          featured ? "mt-1 text-[14px]" : "mt-0.5 text-[12px]"
        }`}
      >
        {formatAed(item.price)}
      </p>
    </Link>
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
      className={`h-10 rounded-full px-2 text-[13px] leading-4 transition-colors duration-200 ${
        selected
          ? "bg-[oklch(0.96_0.01_82)] font-semibold text-[oklch(0.22_0.025_55)]"
          : "font-medium text-[oklch(0.5_0.03_55)]"
      }`}
      style={{ transitionTimingFunction: EASE }}
    >
      {children}
    </button>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} filled={n <= rating} />
      ))}
    </span>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M6 1.2 7.3 4.3l3.4.3-2.6 2.2.8 3.3L6 8.4 3.1 10.1l.8-3.3L1.3 4.6l3.4-.3L6 1.2Z"
        fill={filled ? "oklch(0.52 0.14 72)" : "none"}
        stroke="oklch(0.52 0.14 72)"
        strokeWidth="0.7"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
