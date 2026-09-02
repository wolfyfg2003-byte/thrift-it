import type { Locale } from "@/lib/i18n";
import { waitlistJsonLd } from "@/lib/seo";

type JsonLdProps = {
  locale: Locale;
};

export function JsonLd({ locale }: JsonLdProps) {
  const payload = JSON.stringify(waitlistJsonLd(locale)).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: payload }}
    />
  );
}
