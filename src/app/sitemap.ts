import { LOCALES } from "@/lib/i18n";
import { absoluteUrl, SITE_URL, sitemapLanguageAlternates } from "@/lib/seo";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const languages = sitemapLanguageAlternates();

  const homes = LOCALES.map((locale) => ({
    url: absoluteUrl(locale),
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 1,
    alternates: { languages },
  }));
  const legal = ["/privacy", "/terms", "/support"].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.4,
  }));
  return [...homes, ...legal];
}
