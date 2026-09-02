import { ROBOTS_ALLOW, ROBOTS_DISALLOW, SITE_URL } from "@/lib/seo";
import type { MetadataRoute } from "next";

const sitemapUrl = `${SITE_URL}/sitemap.xml`;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [...ROBOTS_ALLOW],
        disallow: [...ROBOTS_DISALLOW],
      },
      {
        userAgent: "Googlebot",
        allow: [...ROBOTS_ALLOW],
        disallow: [...ROBOTS_DISALLOW],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "ClaudeBot",
          "PerplexityBot",
          "Google-Extended",
          "Applebot-Extended",
          "CCBot",
        ],
        allow: [...ROBOTS_ALLOW],
        disallow: [...ROBOTS_DISALLOW],
      },
    ],
    sitemap: sitemapUrl,
  };
}
