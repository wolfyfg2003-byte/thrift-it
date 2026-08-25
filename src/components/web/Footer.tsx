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
    <footer className="border-t border-[oklch(0.88_0.018_80)] bg-[#FDFBF7]">
      <div className="mx-auto max-w-[72rem] px-5 pt-14 pb-10 lg:px-8 lg:pt-16">
        <h2 className="font-figtree text-[24px] leading-none font-semibold tracking-[-0.03em] text-[oklch(0.22_0.025_55)] lg:text-[32px]">
          How a Thrift It sale is protected
        </h2>
        <Accordion items={GATES} name="sale-protection" heading="h3" />
        <p className="mt-12 text-[12px] leading-4 text-[oklch(0.5_0.02_55)] lg:mt-16">
          Thrift It · Dubai
        </p>
      </div>
    </footer>
  );
}
