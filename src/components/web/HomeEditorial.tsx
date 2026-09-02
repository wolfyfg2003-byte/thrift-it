import { TapedPanel } from "@/components/brand/WashiTape";
import { WaitlistForm } from "@/components/web/WaitlistForm";
import type { Dictionary } from "@/lib/i18n";

type HomeEditorialProps = {
  t: Dictionary;
};

export function HomeEditorial({ t }: HomeEditorialProps) {
  return (
    <section className="flex flex-col justify-center px-5 pt-6 lg:px-0 lg:pt-0">
      <h1 className="text-[28px] leading-[1.05] text-[#2A1A14] rtl:leading-[1.35] lg:text-[32px]">
        {t.home.hero}
      </h1>
      <p className="mt-4 max-w-[40ch] text-[16px] leading-6 text-[#6B4A3A]">
        {t.home.lede}
      </p>

      <div id="waitlist" className="mt-8 scroll-mt-28 lg:mt-10 lg:scroll-mt-24">
        <WaitlistForm t={t} />
        <ul className="mt-4 max-w-[40ch] space-y-1.5 font-[family-name:var(--font-typewriter)] text-[14px] leading-5 text-[#6B4A3A]">
          <li>{t.home.benefitCommission}</li>
          <li>{t.home.benefitInspect}</li>
          <li>{t.home.benefitShipping}</li>
        </ul>
      </div>

      <div className="mt-10">
        <TapedPanel className="px-6 py-6">
          <p className="font-[family-name:var(--font-handwritten)] text-[40px] leading-none text-[#2A1A14]">
            {t.home.zero}
          </p>
          <p className="mt-3 max-w-[36ch] text-[16px] leading-6 text-[#6B4A3A]">
            {t.home.zeroBody}
          </p>
        </TapedPanel>
        <p className="mt-8 font-[family-name:var(--font-typewriter)] text-[20px] leading-7 text-[#2A1A14]">
          {t.home.vipTitle}
        </p>
        <p className="mt-3 max-w-[40ch] text-[16px] leading-6 text-[#6B4A3A]">
          {t.home.vipBody}
        </p>
      </div>
    </section>
  );
}
