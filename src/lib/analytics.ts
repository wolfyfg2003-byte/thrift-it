import { track } from "@vercel/analytics";
import type { Locale } from "@/lib/i18n";

export type WaitlistSurface = "page" | "drawer" | "onboarding";

function currentLocale(): Locale {
  if (typeof document === "undefined") return "en";
  return document.documentElement.lang.startsWith("ar") ? "ar" : "en";
}

/** Pageviews are automatic. Fire this only after the server accepts or rejects a signup. Never send email or phone. */
export function trackWaitlist(
  outcome: "join" | "already",
  surface: WaitlistSurface,
): void {
  track(outcome === "join" ? "waitlist_join" : "waitlist_already", {
    locale: currentLocale(),
    surface,
  });
}
