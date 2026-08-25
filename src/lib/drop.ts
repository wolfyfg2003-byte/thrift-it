import type { Listing } from "@/lib/listings";

type DropSource = Listing | string | undefined;

function dropInstant(source: DropSource): string | undefined {
  if (!source) return undefined;
  return typeof source === "string" ? source : source.dropTime;
}

export function remainingDropMs(source: DropSource, now = Date.now()): number {
  const dropTime = dropInstant(source);
  if (!dropTime) return 0;
  return new Date(dropTime).getTime() - now;
}

export function isDropLocked(source: DropSource, now = Date.now()): boolean {
  return remainingDropMs(source, now) > 0;
}

/** Under an hour: 00:28. An hour or more: 02:45:12. */
export function formatUnlockCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}
