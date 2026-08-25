import type { ReactNode } from "react";

const TABS = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "inbox", label: "Inbox", icon: InboxIcon },
  { id: "sell", label: "Sell", icon: SellIcon },
  { id: "closet", label: "Closet", icon: ClosetIcon },
] as const;

type PhoneFrameProps = {
  children: ReactNode;
  label?: string;
};

export function PhoneFrame({
  children,
  label = "App preview",
}: PhoneFrameProps) {
  return (
    <div className="flex w-full items-center justify-center px-5 lg:mt-0 lg:h-full lg:px-0">
      <div className="mx-auto w-full max-w-[24.5rem] rounded-[2.35rem] border border-[#E5D9C4] bg-[oklch(0.97_0.012_82)] p-[0.65rem] shadow-[0_32px_64px_-36px_oklch(0.22_0.03_55/0.48)] motion-safe:animate-[profile-in_520ms_cubic-bezier(0.25,1,0.5,1)_both]">
        <div className="relative flex h-[min(42rem,calc(100dvh-7rem))] min-h-0 flex-col overflow-hidden rounded-[1.85rem] bg-[#FDFBF7] lg:h-[48rem]">
          <div
            className="pointer-events-none absolute top-2.5 left-1/2 z-20 h-[1.35rem] w-[5.5rem] -translate-x-1/2 rounded-full bg-[oklch(0.22_0.025_55)]"
            aria-hidden
          />
          <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain px-3 pt-10">
            {children}
          </div>
          <nav
            aria-label={label}
            className="pointer-events-none shrink-0 border-t border-[#E5D9C4] bg-[#FDFBF7]"
          >
            <ul className="grid h-[3.85rem] grid-cols-4">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = tab.id === "home";
                return (
                  <li key={tab.id} className="contents">
                    <span
                      className={`flex flex-col items-center justify-center gap-0.5 text-[11px] leading-4 ${
                        active
                          ? "font-semibold text-[oklch(0.22_0.025_55)]"
                          : "text-[oklch(0.5_0.03_55)]"
                      }`}
                    >
                      <Icon active={active} />
                      {tab.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden>
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
    <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden>
      <rect x="4" y="5.5" width="14" height="12" rx="2.2" stroke="currentColor" strokeWidth={active ? "1.7" : "1.45"} />
      <circle cx="11" cy="11.5" r="2.6" stroke="currentColor" strokeWidth={active ? "1.7" : "1.45"} />
    </svg>
  );
}

function InboxIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden>
      <path d="M4 6.2h14v11.3H4V6.2Z" stroke="currentColor" strokeWidth={active ? "1.7" : "1.45"} strokeLinejoin="round" />
      <path d="M4 6.4 11 12l7-5.6" stroke="currentColor" strokeWidth={active ? "1.7" : "1.45"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClosetIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden>
      <path d="M6 8.2h10l.8 10.3H5.2L6 8.2Z" stroke="currentColor" strokeWidth={active ? "1.7" : "1.45"} strokeLinejoin="round" />
      <path d="M8.2 8.2C8.2 6.2 9.4 4.6 11 4.6s2.8 1.6 2.8 3.6" stroke="currentColor" strokeWidth={active ? "1.7" : "1.45"} strokeLinecap="round" />
    </svg>
  );
}
