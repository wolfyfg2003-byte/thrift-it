"use client";

import { en } from "@/lib/i18n/en";
import type { Dictionary, Locale } from "@/lib/i18n";
import { createContext, useContext, useMemo, type ReactNode } from "react";

type LocaleContextValue = {
  locale: Locale;
  t: Dictionary;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  t: en,
});

type LocaleProviderProps = {
  locale: Locale;
  dictionary: Dictionary;
  children: ReactNode;
};

export function LocaleProvider({
  locale,
  dictionary,
  children,
}: LocaleProviderProps) {
  const value = useMemo(
    () => ({ locale, t: dictionary }),
    [locale, dictionary],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useI18n(): LocaleContextValue {
  return useContext(LocaleContext);
}
