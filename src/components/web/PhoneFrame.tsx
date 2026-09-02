import { DockBar } from "@/components/brand/DockBar";
import type { ReactNode } from "react";

type PhoneFrameProps = {
  children: ReactNode;
  label?: string;
};

export function PhoneFrame({
  children,
  label = "App preview",
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
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pt-[3.85rem]">
            {children}
          </div>
          <div className="pointer-events-none shrink-0">
            <DockBar label={label} activeId="home" compact />
          </div>
        </div>
      </div>
    </div>
  );
}
