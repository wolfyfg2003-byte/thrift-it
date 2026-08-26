import { TapedPanel } from "@/components/brand/WashiTape";
import { WaitlistForm } from "@/components/web/WaitlistForm";

export function HomeEditorial() {
  return (
    <section className="flex flex-col justify-center px-5 pt-6 lg:px-0 lg:pt-0">
      <h1 className="text-[28px] leading-[1.05] text-[#2A1A14] lg:text-[32px]">
        Keep the selling price. Or hand us the closet.
      </h1>
      <p className="mt-4 max-w-[40ch] text-[16px] leading-6 text-[#6B4A3A]">
        Dubai contemporary resale with escrow and a courier label — not a
        classified meetup. Watch a sale play inside the phone, then join the
        VIP waitlist.
      </p>

      <div id="waitlist" className="mt-8 scroll-mt-28 lg:mt-10 lg:scroll-mt-24">
        <WaitlistForm />
      </div>

      <div className="mt-10">
        <TapedPanel className="px-6 py-6">
          <p className="font-[family-name:var(--font-handwritten)] text-[40px] leading-none text-[#2A1A14]">
            0%
          </p>
          <p className="mt-3 max-w-[36ch] text-[16px] leading-6 text-[#6B4A3A]">
            Seller commission on self-listed sales. You photograph, you price,
            you keep 100% of the selling price.
          </p>
        </TapedPanel>
        <p className="mt-8 font-[family-name:var(--font-typewriter)] text-[20px] leading-7 text-[#2A1A14]">
          50% VIP Managed Consignment
        </p>
        <p className="mt-3 max-w-[40ch] text-[16px] leading-6 text-[#6B4A3A]">
          Closet Detox is 50/50. We pick up, photograph, list, and store. The
          sale splits once it clears 48-hour escrow — for wardrobes you will
          not shoot yourself.
        </p>
      </div>
    </section>
  );
}
