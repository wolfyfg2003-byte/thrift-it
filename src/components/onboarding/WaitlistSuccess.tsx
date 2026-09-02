"use client";

import { TapedPanel } from "@/components/brand/WashiTape";
import Link from "next/link";

const EASE = "cubic-bezier(0.19, 1, 0.22, 1)";

export function WaitlistSuccess({
  mobile,
  onPreview,
}: {
  mobile: string;
  onPreview: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center pb-10">
      <TapedPanel className="px-5 py-8 motion-safe:animate-[glass-card-up_700ms_cubic-bezier(0.19,1,0.22,1)_both]">
        <h1 className="text-[32px] leading-none text-[#2A1A14]">
          You’re on the list
        </h1>
        <p className="mt-4 max-w-[38ch] text-[16px] leading-6 text-[#6B4A3A]">
          We’ll text {mobile}. The public site stays a waitlist. When the closet opens, this number is how we reach you.
        </p>
        <Link
          href="/"
          className="mt-8 flex h-12 items-center justify-center border border-[#2A1A14] bg-[#2A1A14] text-[14px] font-semibold tracking-[-0.01em] text-[#F9F6F0] shadow-[4px_4px_0_0_#D8829D]"
          style={{ transitionTimingFunction: EASE }}
        >
          Back to Thrift It
        </Link>
        <button
          type="button"
          onClick={onPreview}
          className="mt-3 flex h-12 w-full items-center justify-center border border-[#2A1A14] bg-[#F4EFE6] text-[14px] font-semibold tracking-[-0.01em] text-[#2A1A14] shadow-[3px_3px_0_0_#2A1A14]"
          style={{ transitionTimingFunction: EASE }}
        >
          Preview the closet
        </button>
      </TapedPanel>
    </div>
  );
}
