const GATES = [
  {
    title: "48-Hour Escrow",
    body: "Mamo Pay holds the buyer’s payment after delivery. If no dispute is opened within 48 hours, funds release to the seller.",
  },
  {
    title: "AJEX flat-rate courier",
    body: "Domestic pickup and tracked delivery across the UAE. Buyers pay a published flat shipping rate; a prepaid AJEX label is issued after checkout.",
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
        <p className="font-figtree text-[24px] leading-none font-semibold tracking-[-0.03em] text-[oklch(0.22_0.025_55)] lg:text-[32px]">
          How a Thrift It sale is protected
        </p>
        <div className="mt-10 grid gap-10 lg:mt-12 lg:grid-cols-[1.2fr_0.95fr_0.95fr] lg:gap-x-16">
          {GATES.map((gate) => (
            <div key={gate.title}>
              <h2 className="font-figtree text-[16px] leading-6 font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)] lg:text-[20px] lg:leading-7">
                {gate.title}
              </h2>
              <p className="mt-3 max-w-[36ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
                {gate.body}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-12 text-[12px] leading-4 text-[oklch(0.5_0.02_55)] lg:mt-16">
          Thrift It · Dubai · Demonstration marketplace
        </p>
      </div>
    </footer>
  );
}
