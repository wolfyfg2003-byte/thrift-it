"use client";

import { RansomLogo } from "@/components/brand/RansomLogo";
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
        <div className="min-w-0 pt-1">
          <h1 className="sr-only">Thrift It</h1>
          <RansomLogo href="/app" size="nav" />
          <p className="mt-3 font-[family-name:var(--font-handwritten)] text-[14px] leading-4 text-[#6B4A3A]">
            Demonstration closet — swipe right to offer, left to pass.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          <PlusBadge />
          <Link
            href="/profile"
            aria-label="Your profile"
            className="grid size-10 place-items-center border border-[#2A1A14] bg-[#E4D5C1] font-[family-name:var(--font-display)] text-[13px] text-[#2A1A14] shadow-[3px_3px_0_0_#2A1A14]"
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
