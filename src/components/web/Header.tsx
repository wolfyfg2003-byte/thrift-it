"use client";

import Link from "next/link";

const LINKS = [
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#the-tech", label: "The Tech" },
] as const;

const EASE = "cubic-bezier(0.25, 1, 0.5, 1)";

export function Header() {
  return (
    <div className="fixed inset-x-0 top-0 z-40 bg-[#FDFBF7]">
      <header className="border-b border-[oklch(0.88_0.018_80)]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-6 focus:z-50 focus:rounded-full focus:bg-[oklch(0.22_0.025_55)] focus:px-4 focus:py-2 focus:text-[14px] focus:text-[#FDFBF7]"
        >
          Skip to content
        </a>
        <div className="mx-auto flex h-14 w-full max-w-[72rem] items-center justify-between gap-3 px-5 lg:h-[4.25rem] lg:px-8">
          <Link
            href="/"
            className="shrink-0 font-figtree text-[16px] font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)] lg:text-[18px]"
          >
            Thrift It
          </Link>

          <nav
            aria-label="Website"
            className="hidden items-center gap-9 text-[14px] lg:flex"
          >
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap font-medium text-[oklch(0.42_0.03_55)] transition-colors duration-200 hover:text-[oklch(0.22_0.025_55)]"
                style={{ transitionTimingFunction: EASE }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/#waitlist"
            className="shrink-0 rounded-full bg-[oklch(0.22_0.025_55)] px-3 py-2 text-[12px] font-semibold tracking-[-0.01em] text-[#FDFBF7] transition-colors duration-200 hover:text-[oklch(0.82_0.1_78)] lg:px-5 lg:py-2.5 lg:text-[14px]"
            style={{ transitionTimingFunction: EASE }}
          >
            Join VIP Waitlist
          </Link>
        </div>
        <nav
          aria-label="On this page"
          className="flex h-9 items-center justify-center gap-8 border-t border-[oklch(0.88_0.018_80)] text-[12px] lg:hidden"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-medium text-[oklch(0.42_0.03_55)] transition-colors duration-200 hover:text-[oklch(0.22_0.025_55)]"
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
