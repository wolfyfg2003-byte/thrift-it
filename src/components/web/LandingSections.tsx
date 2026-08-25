import { TeaserDeck } from "@/components/mobile/TeaserDeck";
import { Accordion } from "@/components/web/Accordion";
import { PhoneFrame } from "@/components/web/PhoneFrame";
import type { TeaserDeckData } from "@/lib/listings";

const STEPS = [
  {
    title: "Swipe the closet",
    body: "Pass left, like right. Offers cannot drop below 80% of asking. Demonstration teaser — the live closet is not public yet.",
  },
  {
    title: "Pay into escrow",
    body: "Escrow holds the charge. A prepaid courier label is generated. Nothing is a classified meetup.",
  },
  {
    title: "Inspect, then release",
    body: "After delivery, a 48-hour window. No dispute, and funds release to the seller.",
  },
] as const;

const TECH = [
  {
    title: "Escrow hold",
    body: "The buyer’s payment is held until the inspection window closes. Payout is not instant on tap.",
  },
  {
    title: "Tracked courier",
    body: "Buyers pay a published flat AED 20. A prepaid label is issued after checkout.",
  },
  {
    title: "Two seller doors",
    body: "Self-list at 0% seller commission, or VIP Closet Detox at 50/50 if you will not photograph the wardrobe yourself.",
  },
] as const;

type LandingSectionsProps = {
  deck: TeaserDeckData | null;
};

export function LandingSections({ deck }: LandingSectionsProps) {
  return (
    <div className="mx-auto w-full max-w-[72rem] py-16 lg:px-8">
      <section id="how-it-works" className="scroll-mt-28 lg:scroll-mt-24">
        <div className="px-5 lg:px-0">
          <h2 className="font-figtree text-[20px] leading-7 font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
            How It Works
          </h2>
          <Accordion items={STEPS} name="how-it-works" />
        </div>

        {deck ? (
          <div className="mt-16 grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-10">
            <div className="order-2 px-5 lg:order-1 lg:px-0">
              <p className="text-[12px] font-semibold tracking-[0.14em] text-[oklch(0.42_0.03_55)] uppercase">
                Your turn
              </p>
              <h3 className="font-figtree mt-3 text-[20px] leading-7 font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
                Now try it yourself
              </h3>
              <p className="mt-3 max-w-[40ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
                Pass left, like right, or use the arrow keys. Demonstration
                plates, then the waitlist form.
              </p>
            </div>
            <div className="order-1 lg:order-2">
              <PhoneFrame label="Try the swipe">
                <TeaserDeck deck={deck} />
              </PhoneFrame>
            </div>
          </div>
        ) : null}
      </section>

      <section id="the-tech" className="mt-16 scroll-mt-28 px-5 lg:scroll-mt-24 lg:px-0">
        <h2 className="font-figtree text-[20px] leading-7 font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
          The Tech
        </h2>
        <Accordion items={TECH} name="the-tech" />
      </section>
    </div>
  );
}
