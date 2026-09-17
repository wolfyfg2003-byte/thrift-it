export const INSTAGRAM_USERNAME = "thriftitae";

/** App-link profile URL. `_u` is the form Instagram registers for native handoff. */
export const INSTAGRAM_WEB_URL = `https://www.instagram.com/_u/${INSTAGRAM_USERNAME}/`;

const INSTAGRAM_APP_URL = `instagram://user?username=${INSTAGRAM_USERNAME}`;

function androidIntentUrl(): string {
  const fallback = `https://www.instagram.com/${INSTAGRAM_USERNAME}/`;
  return `intent://www.instagram.com/_u/${INSTAGRAM_USERNAME}/#Intent;package=com.instagram.android;scheme=https;S.browser_fallback_url=${encodeURIComponent(fallback)};end`;
}

/** Desktop keeps the https link. Phones try the native app, then the web profile. */
export function openInstagramProfile(event: MouseEvent): void {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/i.test(ua);
  const android = /Android/i.test(ua);
  if (!ios && !android) return;

  event.preventDefault();

  if (android) {
    window.location.href = androidIntentUrl();
    return;
  }

  const started = Date.now();
  let handedOff = false;
  const onHide = () => {
    if (document.visibilityState === "hidden") handedOff = true;
  };
  document.addEventListener("visibilitychange", onHide);
  window.location.href = INSTAGRAM_APP_URL;
  window.setTimeout(() => {
    document.removeEventListener("visibilitychange", onHide);
    if (handedOff || Date.now() - started > 1800) return;
    window.location.href = INSTAGRAM_WEB_URL;
  }, 650);
}
