"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/app", label: "Home", icon: HomeIcon },
  { href: "/chats", label: "Inbox", icon: InboxIcon },
  { href: "/sell", label: "Sell", icon: SellIcon },
  { href: "/closet", label: "Closet", icon: ClosetIcon },
] as const;

export const APP_DOCK_HEIGHT =
  "calc(4.15rem + env(safe-area-inset-bottom, 0px))";

export default function AppDock() {
  const pathname = usePathname();
  const threadOpen = /^\/chats\/[^/]+/.test(pathname);

  if (threadOpen || pathname.startsWith("/seller/")) return null;

  return (
    <nav
      aria-label="Thrift It"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[oklch(0.86_0.02_80)] bg-[#FDFBF7] pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid h-[4.15rem] max-w-[28rem] grid-cols-4">
        {TABS.map((tab) => {
          const active =
            tab.href === "/app"
              ? pathname === "/app"
              : tab.href === "/closet"
                ? pathname === "/closet" ||
                  pathname.startsWith("/dashboard") ||
                  pathname.startsWith("/settings") ||
                  pathname.startsWith("/profile")
                : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="contents">
              <Link
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-1 text-[12px] leading-4 tracking-[0.01em] transition-colors duration-200 ${
                  active
                    ? "font-semibold text-[oklch(0.22_0.025_55)]"
                    : "text-[oklch(0.5_0.03_55)]"
                }`}
                style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
                aria-current={active ? "page" : undefined}
              >
                <Icon active={active} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M3.5 10.2 11 3.5l7.5 6.7V18a1.5 1.5 0 0 1-1.5 1.5h-3.5v-5.2h-5V19.5H5A1.5 1.5 0 0 1 3.5 18V10.2Z"
        stroke="currentColor"
        strokeWidth={active ? "1.7" : "1.45"}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SellIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect
        x="4"
        y="5.5"
        width="14"
        height="12"
        rx="2.2"
        stroke="currentColor"
        strokeWidth={active ? "1.7" : "1.45"}
      />
      <circle cx="11" cy="11.5" r="2.6" stroke="currentColor" strokeWidth={active ? "1.7" : "1.45"} />
      <path d="M8.2 5.5 9.4 3.8h3.2l1.2 1.7" stroke="currentColor" strokeWidth={active ? "1.7" : "1.45"} strokeLinejoin="round" />
    </svg>
  );
}

function InboxIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M4 6.2h14v11.3H4V6.2Z"
        stroke="currentColor"
        strokeWidth={active ? "1.7" : "1.45"}
        strokeLinejoin="round"
      />
      <path
        d="M4 6.4 11 12l7-5.6"
        stroke="currentColor"
        strokeWidth={active ? "1.7" : "1.45"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClosetIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M6 8.2h10l.8 10.3H5.2L6 8.2Z"
        stroke="currentColor"
        strokeWidth={active ? "1.7" : "1.45"}
        strokeLinejoin="round"
      />
      <path
        d="M8.2 8.2C8.2 6.2 9.4 4.6 11 4.6s2.8 1.6 2.8 3.6"
        stroke="currentColor"
        strokeWidth={active ? "1.7" : "1.45"}
        strokeLinecap="round"
      />
    </svg>
  );
}
