import { track } from "@vercel/analytics";
import { trackClarityEvent } from "@/lib/clarity";
import type { Locale } from "@/lib/i18n";
import { trackMetaLead } from "@/lib/meta-pixel";

export type WaitlistSurface = "page" | "drawer" | "onboarding";

function currentLocale(): Locale {
  if (typeof document === "undefined") return "en";
  return document.documentElement.lang.startsWith("ar") ? "ar" : "en";
}

/** Pageviews are automatic. Fire this only after the server accepts or rejects a signup. Never send email or phone. */
export function trackWaitlist(
  outcome: "join" | "already",
  surface: WaitlistSurface,
  eventId?: string,
): void {
  track(outcome === "join" ? "waitlist_join" : "waitlist_already", {
    locale: currentLocale(),
    surface,
  });
  trackClarityEvent(outcome === "join" ? "waitlist_join" : "waitlist_already");
  if (outcome === "join") {
    trackMetaLead(surface, eventId);
  }
}

export function trackInstagramFollow(): void {
  track("instagram_follow", { locale: currentLocale() });
  trackClarityEvent("instagram_follow");
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return;
  }
  window.fbq("trackCustom", "InstagramFollow");
}
