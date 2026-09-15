import { WaitlistForm } from "@/components/web/WaitlistForm";
import type { Dictionary } from "@/lib/i18n";

type HomeEditorialProps = {
  t: Dictionary;
};

export function HomeEditorial({ t }: HomeEditorialProps) {
  return (
    <section className="flex flex-col justify-center px-5 pt-4 lg:px-0 lg:pt-0">
      <h1 className="max-w-[18ch] text-[28px] leading-[1.08] text-[#2A1A14] rtl:max-w-[22ch] rtl:leading-[1.35] lg:text-[32px]">
        {t.home.hero}
      </h1>
      <p className="mt-3 max-w-[40ch] text-[16px] leading-6 text-[#6B4A3A]">
        {t.home.lede}
      </p>

      <div id="waitlist" className="mt-6 scroll-mt-24 lg:mt-8 lg:scroll-mt-24">
        <WaitlistForm t={t} />
        <p className="mt-4 font-[family-name:var(--font-typewriter)] text-[12px] leading-4 tracking-[0.02em] text-[#6B4A3A]">
          {t.home.brands}
        </p>
      </div>
    </section>
  );
}
