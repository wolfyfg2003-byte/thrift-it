import { TeaserDeck } from "@/components/mobile/TeaserDeck";
import { Accordion } from "@/components/web/Accordion";
import { PhoneFrame } from "@/components/web/PhoneFrame";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { TeaserDeckData } from "@/lib/listings";

type LandingSectionsProps = {
  deck: TeaserDeckData | null;
  locale: Locale;
  t: Dictionary;
};

export function LandingSections({ deck, locale, t }: LandingSectionsProps) {
  return (
    <div className="mx-auto w-full max-w-[72rem] py-16 lg:px-8">
      <section id="how-it-works" className="scroll-mt-28 lg:scroll-mt-24">
        <div className="px-5 lg:px-0">
          <h2 className="text-[20px] leading-7 text-[#2A1A14]">
            {t.how.title}
          </h2>
          <Accordion items={t.how.steps} name="how-it-works" />
        </div>

        {deck ? (
          <div className="mt-16 grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-10">
            <div className="order-2 px-5 lg:order-1 lg:px-0">
              <h3 className="text-[20px] leading-7 text-[#2A1A14]">
                {t.how.tryTitle}
              </h3>
              <p className="mt-3 max-w-[40ch] text-[16px] leading-6 text-[#6B4A3A]">
                {t.how.tryBody}
              </p>
            </div>
            <div className="order-1 lg:order-2">
              <PhoneFrame label={t.how.tryDemo}>
                <TeaserDeck key={locale} deck={deck} t={t} />
              </PhoneFrame>
            </div>
          </div>
        ) : null}
      </section>

      <section id="the-tech" className="mt-16 scroll-mt-28 px-5 lg:scroll-mt-24 lg:px-0">
        <h2 className="text-[20px] leading-7 text-[#2A1A14]">
          {t.tech.title}
        </h2>
        <Accordion items={t.tech.items} name="the-tech" />
      </section>
    </div>
  );
}
