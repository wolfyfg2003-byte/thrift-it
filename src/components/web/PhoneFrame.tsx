import { DockBar } from "@/components/brand/DockBar";
import type { ReactNode } from "react";

type PhoneFrameProps = {
  children: ReactNode;
  label?: string;
  /** Auto-playing hero preview: taps should not look like a live shop. */
  preview?: boolean;
  badge?: string;
};

export function PhoneFrame({
  children,
  label = "App preview",
  preview = false,
  badge,
}: PhoneFrameProps) {
  return (
    <div
      dir="ltr"
      className="flex w-full items-center justify-center px-5 lg:mt-0 lg:h-full lg:px-0"
    >
      <div
        className="mx-auto w-full max-w-[24.5rem] rotate-1 border border-[#2A1A14] bg-[#E4D5C1] p-[0.65rem] shadow-[4px_4px_0_0_#2A1A14]"
        data-phone-preview={label}
      >
        <div className="relative flex h-[min(42rem,calc(100dvh-7rem))] min-h-0 flex-col overflow-hidden bg-[#F9F6F0] lg:h-[48rem]">
          <div
            className="pointer-events-none absolute top-2.5 left-1/2 z-20 h-[1.35rem] w-[5.5rem] -translate-x-1/2 bg-[#2A1A14]"
            aria-hidden
          />
          <div
            className={`flex min-h-0 flex-1 flex-col overflow-hidden px-3 pt-[3.85rem] ${preview ? "pointer-events-none select-none" : ""}`}
          >
            {children}
          </div>
          {preview && badge ? (
            <p className="pointer-events-none absolute inset-x-3 bottom-[4.25rem] z-30 bg-[rgba(241,196,15,0.9)] px-3 py-1.5 text-center font-[family-name:var(--font-handwritten)] text-[13px] leading-4 text-[#2A1A14] -rotate-1">
              {badge}
            </p>
          ) : null}
          <div className="pointer-events-none shrink-0">
            <DockBar label={label} activeId="home" compact />
          </div>
        </div>
      </div>
    </div>
  );
}
