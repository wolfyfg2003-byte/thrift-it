export const LOCALES = ["en", "ar"] as const;

export type Locale = (typeof LOCALES)[number];

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "ar";
}

export type Dictionary = {
  meta: {
    title: string;
    description: string;
    keywords: string[];
    ogAlt: string;
  };
  skip: string;
  nav: {
    site: string;
    onPage: string;
    how: string;
    tech: string;
    waitlist: string;
  };
  lang: {
    group: string;
    en: string;
    ar: string;
  };
  home: {
    hero: string;
    lede: string;
    benefitCommission: string;
    benefitInspect: string;
    benefitShipping: string;
    zero: string;
    zeroBody: string;
    vipTitle: string;
    vipBody: string;
    saleWorks: string;
    saleDemo: string;
  };
  form: {
    email: string;
    mobile: string;
    submit: string;
    pending: string;
    joined: string;
    already: string;
    unknown: string;
    emailError: string;
    mobileError: string;
  };
  how: {
    title: string;
    tryTitle: string;
    tryBody: string;
    tryDemo: string;
    steps: readonly [{ title: string; body: string }, { title: string; body: string }, { title: string; body: string }];
  };
  tech: {
    title: string;
    items: readonly [{ title: string; body: string }, { title: string; body: string }, { title: string; body: string }];
  };
  footer: {
    title: string;
    mark: string;
    gates: readonly [{ title: string; body: string }, { title: string; body: string }, { title: string; body: string }];
  };
  teaser: {
    hint: string;
    gateLabel: string;
    gateTitle: string;
    gateBody: string;
    comingSoon: string;
  };
  jsonLd: {
    slogan: string;
    waitlistName: string;
    waitlistDescription: string;
    offerName: string;
    inspectName: string;
    inspectDescription: string;
    shippingName: string;
    faq: readonly [
      { q: string; a: string },
      { q: string; a: string },
      { q: string; a: string },
    ];
    props: readonly [
      { name: string; value: string },
      { name: string; value: string },
      { name: string; value: string },
      { name: string; value: string },
    ];
  };
};
