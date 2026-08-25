"use client";

import { type SellerRole } from "@/lib/seller-role";
import { useEffect, useId, useMemo } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type SellDropCardProps = {
  role: SellerRole;
  enabled: boolean;
  premiumUsed: boolean;
  dropAt: string;
  onToggle: () => void;
  onDropAtChange: (value: string) => void;
};

export function SellDropCard({
  role,
  enabled,
  premiumUsed,
  dropAt,
  onToggle,
  onDropAtChange,
}: SellDropCardProps) {
  const switchId = useId();
  const dateId = useId();
  const timeId = useId();
  const bounds = useMemo(() => dropBounds(), [enabled]);
  const stamp = parseDropAt(dropAt);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => {
      const field = document.getElementById(dateId);
      if (!field) return;
      const dock = 11.5 * 16;
      const top = field.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: Math.max(0, top - (window.innerHeight - dock - 72)),
        behavior: "smooth",
      });
    }, 320);
    return () => window.clearTimeout(timer);
  }, [dateId, enabled]);

  return (
    <section className="mt-8 rounded-[1.35rem] border border-[oklch(0.88_0.018_80)] bg-[oklch(0.96_0.01_82)] px-4 py-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-[oklch(0.48_0.12_52)] text-[oklch(0.985_0.01_85)]">
          <BoltIcon />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-[family-name:var(--font-bodoni)] text-[20px] leading-7 tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
            Schedule a Live Closet Drop
          </h2>
          <RoleStatus role={role} premiumUsed={premiumUsed} />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-[14px] leading-5 text-[oklch(0.38_0.03_55)]">
          {enabled ? "This listing unlocks at the time you set." : "Queue this piece at the top of the rail."}
        </p>
        <button
          id={switchId}
          type="button"
          role="switch"
          aria-label="Schedule a Live Closet Drop"
          aria-checked={enabled}
          onClick={onToggle}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
            enabled ? "bg-[oklch(0.48_0.12_52)]" : "bg-[oklch(0.82_0.02_75)]"
          }`}
          style={{ transitionTimingFunction: EASE }}
        >
          <span
            className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-[#FDFBF7] shadow-[0_4px_10px_-4px_oklch(0.22_0.03_55/0.35)] transition-transform duration-200 ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
            style={{ transitionTimingFunction: EASE }}
          />
        </button>
      </div>

      <div
        className="grid transition-[grid-template-rows] duration-300"
        style={{
          gridTemplateRows: enabled ? "1fr" : "0fr",
          transitionTimingFunction: EASE,
        }}
      >
        <div className="overflow-hidden">
          <div className="mt-5 scroll-mb-[12rem] border-t border-[oklch(0.88_0.018_80)] pt-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="min-w-0">
                <span className="block text-[14px] leading-5 text-[oklch(0.22_0.025_55)]">
                  Date
                </span>
                <input
                  id={dateId}
                  data-drop-date
                  type="date"
                  min={bounds.minDate}
                  max={bounds.maxDate}
                  value={stamp.date}
                  onChange={(event) =>
                    onDropAtChange(combineDropAt(event.target.value, stamp.time, bounds))
                  }
                  className="mt-1.5 h-12 w-full rounded-2xl border border-[oklch(0.88_0.018_80)] bg-[#FDFBF7] px-3 text-[16px] text-[oklch(0.22_0.025_55)] outline-none focus:border-[oklch(0.48_0.12_52)]"
                />
              </label>
              <label className="min-w-0">
                <span className="block text-[14px] leading-5 text-[oklch(0.22_0.025_55)]">
                  Time
                </span>
                <input
                  id={timeId}
                  type="time"
                  value={stamp.time}
                  onChange={(event) =>
                    onDropAtChange(combineDropAt(stamp.date, event.target.value, bounds))
                  }
                  className="mt-1.5 h-12 w-full rounded-2xl border border-[oklch(0.88_0.018_80)] bg-[#FDFBF7] px-3 text-[16px] text-[oklch(0.22_0.025_55)] outline-none focus:border-[oklch(0.48_0.12_52)]"
                />
              </label>
            </div>
            {stamp.valid ? (
              <p className="mt-4 rounded-[1rem] bg-[oklch(0.93_0.04_82)] px-3.5 py-3 text-[14px] leading-5 text-[oklch(0.32_0.05_52)]">
                Your drop is ready! Your closet will unlock on {formatDropDate(stamp.at)} at{" "}
                {formatDropTime(stamp.at)}!
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function RoleStatus({
  role,
  premiumUsed,
}: {
  role: SellerRole;
  premiumUsed: boolean;
}) {
  if (role === "free") {
    return (
      <p className="mt-2 inline-flex items-center gap-1.5 text-[14px] leading-5 text-[oklch(0.38_0.03_55)]">
        <LockIcon />
        0 of 0 monthly drops remaining
      </p>
    );
  }
  if (role === "premium") {
    return (
      <p className="mt-2 text-[14px] leading-5 text-[oklch(0.38_0.03_55)]">
        {premiumUsed ? "0 of 1" : "1 of 1"} monthly drops remaining
      </p>
    );
  }
  if (role === "influencer") {
    return (
      <p className="mt-2 inline-flex items-center gap-2 text-[14px] leading-5 text-[oklch(0.38_0.03_55)]">
        <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.93_0.04_72)] px-2 py-0.5 text-[12px] font-semibold text-[oklch(0.36_0.08_52)]">
          <StarIcon />
          Partner
        </span>
        Influencer Partner (Unlimited Drops Allowed)
      </p>
    );
  }
  return (
    <p className="mt-2 inline-flex flex-wrap items-center gap-2 text-[14px] leading-5 text-[oklch(0.38_0.03_55)]">
      <span className="rounded-full border border-[oklch(0.78_0.05_72)] bg-[oklch(0.96_0.02_82)] px-2 py-0.5 text-[12px] font-semibold text-[oklch(0.36_0.07_52)]">
        Boutique
      </span>
      VIP Consignment Closet (Managed Multi-Drop Access)
    </p>
  );
}

function dropBounds() {
  const min = new Date(Date.now() + 60_000);
  const max = new Date(Date.now() + WEEK_MS);
  return {
    min: min.getTime(),
    max: max.getTime(),
    minDate: toDateInput(min),
    maxDate: toDateInput(max),
  };
}

function parseDropAt(value: string) {
  const at = value ? new Date(value) : null;
  const valid = Boolean(at && !Number.isNaN(at.getTime()));
  return {
    at: valid && at ? at : null,
    valid,
    date: valid && at ? toDateInput(at) : "",
    time: valid && at ? toTimeInput(at) : "",
  };
}

function combineDropAt(
  date: string,
  time: string,
  bounds: ReturnType<typeof dropBounds>,
): string {
  if (!date || !time) return "";
  const next = new Date(`${date}T${time}`);
  if (Number.isNaN(next.getTime())) return "";
  const clamped = Math.min(bounds.max, Math.max(bounds.min, next.getTime()));
  return new Date(clamped).toISOString();
}

function toDateInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDropDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("en-AE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatDropTime(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleTimeString("en-AE", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function BoltIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13.2 3.2 6.4 13.1c-.28.4 0 .9.48.9h4.22l-.7 6.4c-.08.7.8 1.1 1.24.55l6.9-9.9c.27-.4 0-.9-.48-.9h-4.3l.78-6.4c.08-.68-.8-1.08-1.24-.55Z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden className="text-[oklch(0.48_0.12_52)]">
      <rect x="3" y="6.2" width="8" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4.6 6.2V4.6a2.4 2.4 0 0 1 4.8 0v1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
      <path d="M7 1.4 8.5 5h3.7l-3 2.2 1.2 3.6L7 8.8 3.6 10.8 4.8 7.2 1.8 5h3.7L7 1.4Z" />
    </svg>
  );
}
