"use client";

import { BellIcon } from "@/components/DropIcons";
import { formatUnlockCountdown, isDropLocked, remainingDropMs } from "@/lib/drop";
import type { Listing } from "@/lib/listings";
import { useEffect, useState } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export function DropCalendar({
  drops,
  onToggleWatch,
}: {
  drops: Listing[];
  onToggleWatch: (id: string) => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const upcoming = drops
    .filter((item) => isDropLocked(item, now))
    .sort((a, b) => remainingDropMs(a, now) - remainingDropMs(b, now));

  if (upcoming.length === 0) {
    return (
      <div className="pt-4">
        <p className="font-[family-name:var(--font-display)] text-[20px] leading-7 tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
          Drop Calendar
        </p>
        <p className="mt-3 max-w-[38ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
          Nothing is scheduled. Live pieces stay on the rail.
        </p>
      </div>
    );
  }

  const [lead, ...rest] = upcoming;

  return (
    <div className="pt-4">
      <p className="font-[family-name:var(--font-display)] text-[20px] leading-7 tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
        Drop Calendar
      </p>

      <article className="mt-4 flex items-center gap-3">
        <Thumb listing={lead} className="h-[4.6rem] w-[3.45rem]" />
        <div className="min-w-0 flex-1">
          <p className="font-[family-name:var(--font-display)] text-[20px] leading-6 tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
            {lead.brand}
          </p>
          <p className="mt-1 truncate text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
            {lead.title} · {lead.size}
          </p>
          <p className="mt-1.5 font-[family-name:var(--font-display)] text-[20px] leading-none tracking-[-0.02em] text-[oklch(0.22_0.025_55)] tabular-nums">
            {formatUnlockCountdown(remainingDropMs(lead, now))}
          </p>
        </div>
        <NotifyToggle watched={lead.isWatched} onClick={() => onToggleWatch(lead.id)} />
      </article>

      {rest.length > 0 ? (
        <ul className="mt-2 divide-y divide-[oklch(0.88_0.018_80)] border-t border-[oklch(0.88_0.018_80)]">
          {rest.map((listing) => (
            <li key={listing.id} className="flex items-center gap-3 py-3">
              <Thumb listing={listing} className="size-12" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] leading-5 font-semibold text-[oklch(0.22_0.025_55)]">
                  {listing.brand}
                </p>
                <p className="mt-0.5 truncate text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
                  {listing.size}
                </p>
                <p className="mt-1 text-[14px] leading-5 font-semibold text-[oklch(0.22_0.025_55)] tabular-nums">
                  {formatUnlockCountdown(remainingDropMs(listing, now))}
                </p>
              </div>
              <NotifyToggle
                watched={listing.isWatched}
                onClick={() => onToggleWatch(listing.id)}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Thumb({ listing, className }: { listing: Listing; className: string }) {
  return listing.original_photo_url ? (
    <img
      src={listing.original_photo_url}
      alt=""
      className={`shrink-0 rounded-[0.75rem] object-cover ${className}`}
    />
  ) : (
    <span
      className={`grid shrink-0 place-items-center rounded-[0.75rem] bg-[oklch(0.93_0.02_75)] font-[family-name:var(--font-display)] text-[16px] text-[oklch(0.38_0.05_52)] ${className}`}
    >
      {listing.brand.slice(0, 1)}
    </span>
  );
}

function NotifyToggle({
  watched,
  onClick,
}: {
  watched: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={watched}
      onClick={onClick}
      className={`inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-[14px] font-semibold transition-colors duration-200 ${
        watched
          ? "border border-[oklch(0.78_0.04_72)] bg-[oklch(0.96_0.02_82)] text-[oklch(0.32_0.05_52)]"
          : "bg-[oklch(0.48_0.12_52)] text-[oklch(0.985_0.01_85)]"
      }`}
      style={{ transitionTimingFunction: EASE }}
    >
      <BellIcon className="h-3.5 w-3.5" />
      {watched ? "Watching" : "Notify"}
    </button>
  );
}
