import { isWebsitePixelPath } from "@/lib/meta-pixel";

export const CLARITY_PROJECT_ID = (
  process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? "yjns2wtlyb"
).replace(/[^a-zA-Z0-9]/g, "");

export { isWebsitePixelPath as isWebsiteClarityPath };

/** Official Clarity tag. Project id is public; it still must not include quotes. */
export function clarityHeadScript(projectId: string): string {
  return `(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window,document,"clarity","script","${projectId}");`;
}

type ClarityFn = {
  (...args: unknown[]): void;
  q?: unknown[];
};

declare global {
  interface Window {
    clarity?: ClarityFn;
  }
}

export function trackClarityEvent(name: string): void {
  if (typeof window === "undefined" || typeof window.clarity !== "function") {
    return;
  }
  window.clarity("event", name);
}
