"use client";

import { RansomLogo } from "@/components/brand/RansomLogo";
import Link from "next/link";

const LINKS = [
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#the-tech", label: "The Tech" },
] as const;

const EASE = "cubic-bezier(0.19, 1, 0.22, 1)";

export function Header() {
  return (
    <div className="fixed inset-x-0 top-0 z-40 bg-[#F9F6F0]">
      <header className="relative border-b border-[#2A1A14]">
        <span
          aria-hidden
          className="washi-grain pointer-events-none absolute -bottom-2 left-10 h-3 w-28 -rotate-2 bg-[rgba(241,196,15,0.8)]"
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-6 focus:z-50 focus:border focus:border-[#2A1A14] focus:bg-[#2A1A14] focus:px-4 focus:py-2 focus:text-[14px] focus:text-[#F9F6F0]"
        >
          Skip to content
        </a>
        <div className="mx-auto flex h-[4.25rem] w-full max-w-[72rem] items-center justify-between gap-3 px-5 lg:h-[4.75rem] lg:px-8">
          <RansomLogo />

          <nav
            aria-label="Website"
            className="hidden items-center gap-9 font-[family-name:var(--font-typewriter)] text-[14px] lg:flex"
          >
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap text-[#6B4A3A] transition-colors duration-200 hover:text-[#2A1A14]"
                style={{ transitionTimingFunction: EASE }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/#waitlist"
            className="shrink-0 border border-[#2A1A14] bg-[#D8829D] px-3 py-2 text-[12px] font-semibold tracking-[-0.01em] text-[#2A1A14] shadow-[3px_3px_0_0_#2A1A14] lg:px-5 lg:py-2.5 lg:text-[14px]"
            style={{ transitionTimingFunction: EASE }}
          >
            Join waitlist
          </Link>
        </div>
        <nav
          aria-label="On this page"
          className="flex h-9 items-center justify-center gap-8 border-t border-[#2A1A14] font-[family-name:var(--font-typewriter)] text-[12px] lg:hidden"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[#6B4A3A] transition-colors duration-200 hover:text-[#2A1A14]"
              style={{ transitionTimingFunction: EASE }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
    </div>
  );
}
