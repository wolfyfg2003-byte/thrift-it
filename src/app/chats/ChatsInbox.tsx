"use client";

import AppDock from "@/components/AppDock";
import { counterpart, statusLabel, type InboxRow, type InboxSide } from "@/lib/chats";
import {
  restoreListingSales,
  syncListingSaleFromServer,
  useListingSales,
} from "@/lib/listing-sale-store";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function ChatsInbox({ rows }: { rows: InboxRow[] }) {
  const [side, setSide] = useState<InboxSide>("buying");
  const sales = useListingSales();
  const visible = useMemo(
    () => rows.filter((row) => row.side === side),
    [rows, side],
  );

  useEffect(() => {
    restoreListingSales();
    const listingIds = [...new Set(rows.map((row) => row.listingId))];
    void Promise.all(listingIds.map((id) => syncListingSaleFromServer(id)));
  }, [rows]);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[28rem] bg-[#FDFBF7] px-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header>
        <h1 className="font-[family-name:var(--font-bodoni)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.22_0.025_55)]">
          Inbox
        </h1>
        <p className="mt-3 max-w-[40ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
          {side === "buying"
            ? "Offers you made on pieces you swiped right. Demonstration threads."
            : "Offers from buyers on your closet. Demonstration threads."}
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Inbox side"
        className="mt-7 grid grid-cols-2 rounded-full bg-[oklch(0.96_0.01_82)] p-1"
      >
        <TabButton selected={side === "buying"} onClick={() => setSide("buying")}>
          Buying
        </TabButton>
        <TabButton selected={side === "selling"} onClick={() => setSide("selling")}>
          Selling
        </TabButton>
      </div>

      <ul className="mt-1">
        {visible.map((row) => {
          const person = counterpart(row);
          const listing = row.listing;
          const sale = sales[row.listingId];
          const closed = Boolean(sale) && sale.winningChatId !== row.id;
          const won = Boolean(sale) && sale.winningChatId === row.id;
          return (
            <li key={row.id} className="border-b border-[oklch(0.88_0.018_80)]">
              <Link
                href={`/chats/${row.id}`}
                className={`flex items-start gap-3.5 py-5 transition-colors duration-200 hover:bg-[oklch(0.97_0.008_82)] ${
                  closed ? "opacity-70" : ""
                }`}
                style={{ transitionTimingFunction: EASE }}
              >
                <span
                  aria-hidden="true"
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-[oklch(0.93_0.02_75)] font-[family-name:var(--font-bodoni)] text-[14px] text-[oklch(0.32_0.04_52)]"
                >
                  {person.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[16px] font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
                      {person.handle}
                    </span>
                    <time className="shrink-0 text-[12px] leading-4 text-[oklch(0.5_0.025_55)]">
                      {row.lastAt}
                    </time>
                  </span>
                  <StatusBadge row={row} closed={closed} won={won} />
                  <span className="mt-1.5 line-clamp-2 text-[14px] leading-5 text-[oklch(0.38_0.03_55)]">
                    {closed
                      ? "This item was purchased by another buyer. Chat closed."
                      : won
                        ? "Sold — escrow held. Other offers on this piece are closed."
                        : row.lastMessage}
                  </span>
                </span>
                {listing?.original_photo_url ? (
                  <img
                    src={listing.original_photo_url}
                    alt=""
                    className="size-14 shrink-0 rounded-[0.85rem] border border-[oklch(0.88_0.018_80)] object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="grid size-14 shrink-0 place-items-center rounded-[0.85rem] border border-[oklch(0.88_0.018_80)] bg-[oklch(0.93_0.02_75)] font-[family-name:var(--font-bodoni)] text-[16px] text-[oklch(0.38_0.05_52)]"
                  >
                    {listing?.brand.slice(0, 1) ?? "T"}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {visible.length === 0 ? (
        <p className="mt-10 max-w-[36ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
          {side === "buying"
            ? "Swipe right on the deck to start an offer."
            : "When someone offers on your closet, it lands here."}
        </p>
      ) : null}

      <AppDock />
    </main>
  );
}

function StatusBadge({
  row,
  closed,
  won,
}: {
  row: InboxRow;
  closed: boolean;
  won: boolean;
}) {
  const shipped = !closed && !won && row.status === "shipped";
  const accepted = !closed && !won && row.status === "accepted";
  const label = closed
    ? "Sold Out"
    : won
      ? "Sold (this buyer)"
      : statusLabel(row);
  return (
    <span
      className={`mt-1.5 inline-block rounded-full px-2.5 py-[3px] text-[12px] leading-4 ${
        closed
          ? "bg-[oklch(0.91_0.02_65)] text-[oklch(0.36_0.04_50)]"
          : won
            ? "bg-[oklch(0.93_0.02_72)] text-[oklch(0.32_0.06_52)]"
            : shipped
              ? "bg-[oklch(0.93_0.018_95)] text-[oklch(0.32_0.04_95)]"
              : accepted
                ? "bg-[oklch(0.93_0.02_72)] text-[oklch(0.32_0.06_52)]"
                : "bg-[oklch(0.94_0.012_82)] text-[oklch(0.38_0.03_55)]"
      }`}
    >
      {label}
    </span>
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
          ? "bg-[#FDFBF7] font-semibold text-[oklch(0.22_0.025_55)] shadow-[0_6px_16px_-10px_oklch(0.22_0.03_55/0.35)]"
          : "font-medium text-[oklch(0.5_0.03_55)]"
      }`}
      style={{ transitionTimingFunction: EASE }}
    >
      {children}
    </button>
  );
}
