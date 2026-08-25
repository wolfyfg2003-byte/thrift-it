import { WaitlistForm } from "@/components/web/WaitlistForm";

export function HomeEditorial() {
  return (
    <section className="flex flex-col justify-center px-5 pt-6 lg:px-0 lg:pt-0">
      <h1 className="font-figtree text-[28px] leading-none font-semibold tracking-[-0.03em] text-[oklch(0.22_0.025_55)] lg:text-[32px]">
        Keep the selling price. Or hand us the closet.
      </h1>
      <p className="mt-4 max-w-[40ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
        Dubai contemporary resale with escrow and a courier label — not a
        classified meetup. Watch a sale play inside the phone, then join the
        VIP waitlist.
      </p>

      <div id="waitlist" className="mt-8 scroll-mt-28 lg:scroll-mt-24 lg:mt-10">
        <WaitlistForm />
      </div>

      <div className="mt-10">
        <div
          className="rounded-[1.5rem] border bg-[oklch(0.97_0.012_82)] px-6 py-6"
          style={{ borderColor: "#E5D9C4" }}
        >
          <p className="text-[32px] leading-none font-semibold tracking-[-0.03em] text-[oklch(0.22_0.025_55)]">
            0%
          </p>
          <p className="mt-3 max-w-[36ch] text-[16px] leading-6 text-[oklch(0.38_0.03_55)]">
            Seller commission on self-listed sales. You photograph, you price,
            you keep 100% of the selling price.
          </p>
        </div>
        <p className="mt-8 text-[20px] leading-7 font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
          50% VIP Managed Consignment
        </p>
        <p className="mt-3 max-w-[40ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
          Closet Detox is 50/50. We pick up, photograph, list, and store. The
          sale splits once it clears 48-hour escrow — for wardrobes you will
          not shoot yourself.
        </p>
      </div>
    </section>
  );
}
