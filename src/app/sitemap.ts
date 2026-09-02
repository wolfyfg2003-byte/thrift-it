import { LOCALES } from "@/lib/i18n";
import { absoluteUrl, sitemapLanguageAlternates } from "@/lib/seo";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const languages = sitemapLanguageAlternates();

  return LOCALES.map((locale) => ({
    url: absoluteUrl(locale),
    lastModified,
    changeFrequency: "weekly",
    priority: 1,
    alternates: { languages },
  }));
}
