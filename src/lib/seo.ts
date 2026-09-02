import { getDictionary, localeHome, type Locale } from "@/lib/i18n";
import type { Metadata } from "next";

/** Public origin for canonical URLs, Open Graph, and JSON-LD. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://thrifit.ae"
).replace(/\/$/, "");

export const SITE_NAME = "Thrift It";

const APP_INDEX_BLOCK = [
  "/app",
  "/chats",
  "/checkout",
  "/closet",
  "/sell",
  "/signup",
  "/profile",
  "/settings",
  "/dashboard",
  "/seller",
  "/product",
  "/api",
] as const;

export const ROBOTS_DISALLOW = [...APP_INDEX_BLOCK];

/** Public waitlist landers Google should crawl. App and demo routes stay out. */
export const ROBOTS_ALLOW = ["/", "/ar", "/llms.txt"] as const;

const HREFLANG = {
  "en-AE": "/",
  "ar-AE": "/ar",
  "x-default": "/",
} as const;

export function absoluteUrl(locale: Locale): string {
  const path = localeHome(locale);
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

/** Absolute hreflang set for sitemap.xml (Google wants full URLs). */
export function sitemapLanguageAlternates(): Record<string, string> {
  return {
    "en-AE": absoluteUrl("en"),
    "ar-AE": absoluteUrl("ar"),
    "x-default": absoluteUrl("en"),
  };
}

function ogImagePath(locale: Locale): string {
  return locale === "ar" ? "/ar/opengraph-image" : "/opengraph-image";
}

export function pageMetadata(locale: Locale): Metadata {
  const t = getDictionary(locale);
  const url = absoluteUrl(locale);
  const image = ogImagePath(locale);

  return {
    title: {
      absolute: t.meta.title,
    },
    description: t.meta.description,
    keywords: t.meta.keywords,
    alternates: {
      canonical: localeHome(locale),
      languages: HREFLANG,
    },
    openGraph: {
      type: "website",
      locale: locale === "ar" ? "ar_AE" : "en_AE",
      alternateLocale: locale === "ar" ? ["en_AE"] : ["ar_AE"],
      url,
      siteName: SITE_NAME,
      title: t.meta.title,
      description: t.meta.description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: t.meta.ogAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.title,
      description: t.meta.description,
      images: [image],
    },
  };
}

const enMeta = getDictionary("en").meta;

export const SEO_TITLE = enMeta.title;
export const SEO_DESCRIPTION = enMeta.description;

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: enMeta.title,
    template: `%s · ${SITE_NAME}`,
  },
  description: enMeta.description,
  keywords: enMeta.keywords,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "fashion",
  referrer: "origin-when-cross-origin",
  alternates: {
    languages: HREFLANG,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_AE",
    alternateLocale: ["ar_AE"],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: enMeta.title,
    description: enMeta.description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: enMeta.ogAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: enMeta.title,
    description: enMeta.description,
    images: ["/opengraph-image"],
  },
  other: {
    "geo.region": "AE-DU",
    "geo.placename": "Dubai",
    "geo.position": "25.2048;55.2708",
    ICBM: "25.2048, 55.2708",
  },
};

type JsonLdNode = Record<string, unknown>;

/**
 * LocalBusiness + Product graph for the waitlist site.
 * Claims match on-page copy only: waitlist, 0% self-list, 48-hour inspect, AED 20 UAE shipping.
 */
export function waitlistJsonLd(locale: Locale = "en"): JsonLdNode {
  const t = getDictionary(locale);
  const pageUrl = absoluteUrl(locale);
  const businessId = `${SITE_URL}/#business`;
  const websiteId = `${SITE_URL}/#website`;
  const webpageId = `${pageUrl}#webpage`;
  const productId = `${pageUrl}#waitlist`;
  const offerId = `${pageUrl}#waitlist-offer`;
  const faqId = `${pageUrl}#faq`;
  const image = `${SITE_URL}${ogImagePath(locale)}`;
  const inLanguage = locale === "ar" ? "ar-AE" : "en-AE";

  const business: JsonLdNode = {
    "@type": ["LocalBusiness", "OnlineStore"],
    "@id": businessId,
    name: SITE_NAME,
    url: SITE_URL,
    image,
    logo: image,
    description: t.meta.description,
    slogan: t.jsonLd.slogan,
    currenciesAccepted: "AED",
    priceRange: "AED",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dubai",
      addressRegion: "Dubai",
      addressCountry: "AE",
    },
    areaServed: [
      { "@type": "City", name: locale === "ar" ? "دبي" : "Dubai" },
      {
        "@type": "Country",
        name: locale === "ar" ? "الإمارات العربية المتحدة" : "United Arab Emirates",
      },
    ],
    knowsAbout: t.meta.keywords,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: t.jsonLd.waitlistName,
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: { "@id": productId },
        },
      ],
    },
  };

  const product: JsonLdNode = {
    "@type": "Product",
    "@id": productId,
    name: t.jsonLd.waitlistName,
    description: t.jsonLd.waitlistDescription,
    brand: { "@type": "Brand", name: SITE_NAME, "@id": businessId },
    image,
    category: locale === "ar" ? "أزياء مسبقة الحب" : "Pre-loved fashion",
    audience: {
      "@type": "PeopleAudience",
      geographicArea: {
        "@type": "Country",
        name: locale === "ar" ? "الإمارات العربية المتحدة" : "United Arab Emirates",
      },
    },
    additionalProperty: t.jsonLd.props.map((item) => ({
      "@type": "PropertyValue",
      name: item.name,
      value: item.value,
    })),
    offers: {
      "@type": "Offer",
      "@id": offerId,
      url: `${pageUrl}#waitlist`,
      name: t.jsonLd.offerName,
      price: "0",
      priceCurrency: "AED",
      availability: "https://schema.org/PreOrder",
      eligibleRegion: {
        "@type": "DefinedRegion",
        addressCountry: "AE",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        name: t.jsonLd.shippingName,
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "20",
          currency: "AED",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "AE",
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        name: t.jsonLd.inspectName,
        applicableCountry: "AE",
        returnPolicyCategory:
          "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 2,
        description: t.jsonLd.inspectDescription,
      },
    },
  };

  const faq: JsonLdNode = {
    "@type": "FAQPage",
    "@id": faqId,
    inLanguage,
    mainEntity: t.jsonLd.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      business,
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: SITE_URL,
        name: SITE_NAME,
        description: t.meta.description,
        inLanguage,
        publisher: { "@id": businessId },
      },
      {
        "@type": "WebPage",
        "@id": webpageId,
        url: pageUrl,
        name: t.meta.title,
        description: t.meta.description,
        isPartOf: { "@id": websiteId },
        about: { "@id": businessId },
        primaryImageOfPage: { "@id": `${pageUrl}#og-image` },
        mainEntity: [{ "@id": productId }, { "@id": faqId }],
        inLanguage,
      },
      {
        "@type": "ImageObject",
        "@id": `${pageUrl}#og-image`,
        url: image,
        contentUrl: image,
        caption: t.meta.title,
      },
      product,
      faq,
    ],
  };
}
