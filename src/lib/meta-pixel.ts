import { ROBOTS_DISALLOW } from "@/lib/seo";

export const META_PIXEL_ID = (
  process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "2005054940202593"
).replace(/\D/g, "");

/** Waitlist landers only. App, signup, and checkout stay out. */
export function isWebsitePixelPath(pathname: string): boolean {
  const path = pathname.split("?")[0] || "/";
  return !ROBOTS_DISALLOW.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/** Inline <head> bootstrap so Meta's crawler sees fbq without running Next.js chunks. */
export function metaPixelHeadScript(pixelId: string): string {
  return `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');
fbq('track','PageView');`;
}

type FbqFn = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  loaded: boolean;
  version: string;
  push: FbqFn;
};

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
  }
}

export function trackMetaLead(surface: string, eventId?: string): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return;
  }
  const params = {
    content_name: "waitlist",
    content_category: surface,
  };
  if (eventId) {
    window.fbq("track", "Lead", params, { eventID: eventId });
    return;
  }
  window.fbq("track", "Lead", params);
}
