import { ar } from "./ar";
import { en } from "./en";
import type { Dictionary, Locale } from "./types";

export type { Dictionary, Locale } from "./types";
export { isLocale, LOCALES } from "./types";

export function getDictionary(locale: Locale): Dictionary {
  return locale === "ar" ? ar : en;
}

export function localePath(locale: Locale, hash?: string): string {
  const base = locale === "ar" ? "/ar" : "/";
  if (!hash) return base;
  const id = hash.replace(/^#/, "");
  return `${base}#${id}`;
}

export function localeHome(locale: Locale): string {
  return locale === "ar" ? "/ar" : "/";
}
