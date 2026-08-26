import { Accordion } from "@/components/web/Accordion";

const GATES = [
  {
    title: "48-Hour Escrow",
    body: "Payment is held after delivery. If no dispute is opened within 48 hours, funds release to the seller.",
  },
  {
    title: "Tracked courier",
    body: "Domestic pickup and tracked delivery across the UAE. Buyers pay a published flat shipping rate; a prepaid label is issued after checkout.",
  },
  {
    title: "UAE Consumer Protection",
    body: "Listings show a clear AED price, a tracked parcel, and a window to raise a dispute — the terms UAE distance-sale buyers are owed.",
  },
] as const;

export function Footer() {
  return (
    <footer className="relative border-t border-[#2A1A14] bg-[#F9F6F0]">
      <span
        aria-hidden
        className="washi-grain pointer-events-none absolute top-[-0.4rem] left-10 h-3 w-24 -rotate-2 bg-[#D8829D]/80"
      />
      <div className="mx-auto max-w-[72rem] px-5 pt-14 pb-10 lg:px-8 lg:pt-16">
        <h2 className="text-[24px] leading-none text-[#2A1A14] lg:text-[32px]">
          How a Thrift It sale is protected
        </h2>
        <Accordion items={GATES} name="sale-protection" heading="h3" />
        <p className="mt-12 font-[family-name:var(--font-handwritten)] text-[14px] leading-4 text-[#6B4A3A] lg:mt-16">
          Thrift It · Dubai
        </p>
      </div>
    </footer>
  );
}
