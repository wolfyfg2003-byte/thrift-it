"use client";

import type { Dictionary, Locale } from "@/lib/i18n";
import { localeHome } from "@/lib/i18n";
import { useEffect, useState } from "react";

type LanguageToggleProps = {
  locale: Locale;
  t: Dictionary;
};

const EASE = "cubic-bezier(0.19, 1, 0.22, 1)";
const inactiveClass =
  "px-1 py-2 text-[#6B4A3A] transition-colors duration-200 hover:text-[#2A1A14]";
const activeClass = "px-1 py-2 text-[#2A1A14]";

export function LanguageToggle({ locale, t }: LanguageToggleProps) {
  const [ready, setReady] = useState(false);
  const english = locale === "en";

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div
      role="group"
      aria-label={t.lang.group}
      className="flex shrink-0 items-center gap-1 font-[family-name:var(--font-typewriter)] text-[12px] leading-4 lg:text-[14px]"
    >
      <TogglePart
        active={english}
        ready={ready}
        label={t.lang.en}
        lang="en"
        href={localeHome("en")}
      />
      <span aria-hidden className="text-[#6B4A3A]">
        ·
      </span>
      <TogglePart
        active={!english}
        ready={ready}
        label={t.lang.ar}
        lang="ar"
        href={localeHome("ar")}
      />
    </div>
  );
}

function TogglePart({
  active,
  ready,
  label,
  lang,
  href,
}: {
  active: boolean;
  ready: boolean;
  label: string;
  lang: "en" | "ar";
  href: string;
}) {
  if (!ready || active) {
    return (
      <span
        aria-current={active ? "true" : undefined}
        lang={lang}
        className={active ? activeClass : inactiveClass}
      >
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      lang={lang}
      className={inactiveClass}
      style={{ transitionTimingFunction: EASE }}
      onClick={() => window.location.assign(href)}
    >
      {label}
    </button>
  );
}
