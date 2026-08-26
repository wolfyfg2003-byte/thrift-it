import { HomeEditorial } from "@/components/web/HomeEditorial";
import { LandingSections } from "@/components/web/LandingSections";
import { PhoneFrame } from "@/components/web/PhoneFrame";
import { TeaserPipeline } from "@/components/mobile/TeaserPipeline";
import { getTeaserDeck } from "@/lib/listings";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: "Thrift It",
  },
};

export default async function WebsiteHomePage() {
  const deck = getTeaserDeck();

  return (
    <main className="min-h-dvh w-full bg-[#F9F6F0]">
      <div className="mx-auto grid w-full max-w-[72rem] grid-cols-1 items-stretch gap-10 px-0 py-8 lg:grid-cols-2 lg:gap-10 lg:px-8 lg:py-12">
        <div className="order-2 lg:order-1">
          <HomeEditorial />
        </div>
        <div className="order-1 lg:order-2">
          <p className="mb-4 px-5 text-center font-[family-name:var(--font-handwritten)] text-[14px] text-[#6B4A3A] lg:px-0">
            How a sale works
          </p>
          <PhoneFrame label="Sale demonstration">
            <TeaserPipeline />
          </PhoneFrame>
        </div>
      </div>
      <LandingSections deck={deck} />
    </main>
  );
}
