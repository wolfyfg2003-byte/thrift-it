export const META_PIXEL_ID = (
  process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "2005054940202593"
).replace(/\D/g, "");

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

export function trackMetaLead(surface: string): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return;
  }
  window.fbq("track", "Lead", {
    content_name: "waitlist",
    content_category: surface,
  });
}
