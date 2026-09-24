import { Accordion } from "@/components/web/Accordion";
import { getDictionary } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n/server";
import Link from "next/link";

export async function Footer() {
  const t = getDictionary(await getRequestLocale());

  return (
    <footer className="relative border-t border-[#2A1A14] bg-[#F9F6F0]">
      <span
        aria-hidden
        className="washi-grain pointer-events-none absolute top-[-0.4rem] start-10 h-3 w-24 -rotate-2 bg-[#D8829D]/80"
      />
      <div className="mx-auto max-w-[72rem] px-5 pt-14 pb-10 lg:px-8 lg:pt-16">
        <h2 className="text-[24px] leading-none text-[#2A1A14] rtl:leading-[1.35] lg:text-[32px]">
          {t.footer.title}
        </h2>
        <Accordion items={t.footer.gates} name="sale-protection" heading="h3" />
        <p className="mt-12 font-[family-name:var(--font-handwritten)] text-[14px] leading-4 text-[#6B4A3A] lg:mt-16">
          {t.footer.mark}
        </p>
        <nav
          aria-label="Legal"
          className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-[#C9B8A4] pt-6 font-[family-name:var(--font-typewriter)] text-[12px] uppercase tracking-[0.12em] text-[#6B4A3A]"
        >
          <Link href="/privacy" className="underline decoration-transparent transition-colors hover:text-[#2A1A14] hover:decoration-[#2A1A14]">
            Privacy
          </Link>
          <Link href="/terms" className="underline decoration-transparent transition-colors hover:text-[#2A1A14] hover:decoration-[#2A1A14]">
            Terms
          </Link>
          <Link href="/support" className="underline decoration-transparent transition-colors hover:text-[#2A1A14] hover:decoration-[#2A1A14]">
            Support
          </Link>
        </nav>
      </div>
    </footer>
  );
}
