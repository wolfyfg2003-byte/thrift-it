import { useSyncExternalStore } from "react";

const STORAGE_KEY = "thrift-it.drop-notify";
const listeners = new Set<() => void>();
let watched = new Set<string>();
let restored = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...watched]));
  } catch {
    /* private mode */
  }
}

export function restoreDropNotify() {
  if (restored || typeof window === "undefined") return;
  restored = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    watched = new Set(
      Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === "string")
        : [],
    );
  } catch {
    watched = new Set();
  }
  emit();
}

export function isWatchingDrop(id: string): boolean {
  return watched.has(id);
}

export function toggleDropNotify(id: string): boolean {
  restoreDropNotify();
  const next = new Set(watched);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  watched = next;
  persist();
  emit();
  return watched.has(id);
}

export function useDropNotify() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => watched,
    () => watched,
  );
}
