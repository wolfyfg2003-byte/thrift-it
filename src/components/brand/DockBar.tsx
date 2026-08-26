import Link from "next/link";

const EASE = "cubic-bezier(0.19, 1, 0.22, 1)";

export const DOCK_TABS = [
  { href: "/app", id: "home", label: "Home", icon: HomeIcon },
  { href: "/chats", id: "inbox", label: "Inbox", icon: InboxIcon },
  { href: "/sell", id: "sell", label: "Sell", icon: SellIcon },
  { href: "/closet", id: "closet", label: "Closet", icon: ClosetIcon },
] as const;

export type DockTabId = (typeof DOCK_TABS)[number]["id"];

type DockBarProps = {
  label: string;
  activeId?: DockTabId;
  interactive?: boolean;
  pathname?: string;
  compact?: boolean;
};

export function DockBar({
  label,
  activeId,
  interactive = false,
  pathname = "",
  compact = false,
}: DockBarProps) {
  return (
    <nav
      aria-label={label}
      className={`cardboard-sheet relative border-t border-[#2A1A14] ${
        compact ? "" : "pb-[env(safe-area-inset-bottom)]"
      }`}
    >
      <span
        aria-hidden
        className="washi-grain pointer-events-none absolute -top-1.5 left-[12%] h-2.5 w-[4.4rem] -rotate-2 bg-[rgba(241,196,15,0.8)]"
      />
      <span
        aria-hidden
        className="washi-grain pointer-events-none absolute -top-1 right-[18%] h-2.5 w-14 rotate-[8deg] bg-[#D8829D]/80"
      />
      <ul
        className={`mx-auto grid grid-cols-4 ${
          compact ? "h-[3.85rem]" : "mx-auto h-[4.15rem] max-w-[28rem]"
        }`}
      >
        {DOCK_TABS.map((tab, index) => {
          const active =
            activeId != null
              ? tab.id === activeId
              : tab.href === "/app"
                ? pathname === "/app"
                : tab.href === "/closet"
                  ? pathname === "/closet" ||
                    pathname.startsWith("/dashboard") ||
                    pathname.startsWith("/settings") ||
                    pathname.startsWith("/profile")
                  : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;
          const body = (
            <>
              <Icon active={active} compact={compact} />
              {tab.label}
            </>
          );
          const tilt = index === 1 ? "-rotate-[1.5deg]" : index === 2 ? "rotate-[1.2deg]" : index === 3 ? "-rotate-1" : "rotate-[0.8deg]";
          const className = `flex h-full flex-col items-center justify-center gap-0.5 font-[family-name:var(--font-typewriter)] ${
            compact ? "text-[10px]" : "text-[12px]"
          } leading-4 ${
            active
              ? `text-[#2A1A14] ${tilt}`
              : "text-[#6B4A3A]"
          }`;

          return (
            <li key={tab.id} className="relative flex items-stretch justify-center px-1">
              {active ? (
                <span
                  aria-hidden
                  className={`pointer-events-none absolute top-2 bottom-2 w-[3.35rem] border border-[#2A1A14] bg-[#D8829D] shadow-[2px_2px_0_0_#2A1A14] ${tilt}`}
                />
              ) : null}
              {interactive ? (
                <Link
                  href={tab.href}
                  className={`relative z-10 w-full ${className}`}
                  style={{ transitionTimingFunction: EASE }}
                  aria-current={active ? "page" : undefined}
                >
                  {body}
                </Link>
              ) : (
                <span className={`relative z-10 w-full ${className}`}>{body}</span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function HomeIcon({ active, compact }: { active: boolean; compact?: boolean }) {
  const size = compact ? 18 : 22;
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M3.5 10.2 11 3.5l7.5 6.7V18a1.5 1.5 0 0 1-1.5 1.5h-3.5v-5.2h-5V19.5H5A1.5 1.5 0 0 1 3.5 18V10.2Z"
        stroke="currentColor"
        strokeWidth={active ? "1.7" : "1.45"}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SellIcon({ active, compact }: { active: boolean; compact?: boolean }) {
  const size = compact ? 18 : 22;
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
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
      <path
        d="M8.2 5.5 9.4 3.8h3.2l1.2 1.7"
        stroke="currentColor"
        strokeWidth={active ? "1.7" : "1.45"}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InboxIcon({ active, compact }: { active: boolean; compact?: boolean }) {
  const size = compact ? 18 : 22;
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
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

function ClosetIcon({ active, compact }: { active: boolean; compact?: boolean }) {
  const size = compact ? 18 : 22;
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
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

