"use client";

import { PlusBadge } from "@/components/PlusPaywall";
import { restoreProfile, useProfile } from "@/lib/profile-store";
import { restorePlus } from "@/lib/plus-store";
import Link from "next/link";
import { useEffect } from "react";

export default function HomeHeader() {
  const profile = useProfile();

  useEffect(() => {
    restorePlus();
    restoreProfile();
  }, []);

  const initials = initialsFrom(profile.name);

  return (
    <header className="mb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-[family-name:var(--font-bodoni)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.22_0.025_55)]">
            Thrift It
          </h1>
          <p className="mt-2 text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
            Demonstration closet — swipe right to offer, left to pass.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          <PlusBadge />
          <Link
            href="/profile"
            aria-label="Your profile"
            className="grid size-10 place-items-center rounded-full bg-[oklch(0.93_0.02_75)] font-[family-name:var(--font-bodoni)] text-[13px] text-[oklch(0.32_0.04_52)]"
          >
            {initials}
          </Link>
        </div>
      </div>
    </header>
  );
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "YO";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
