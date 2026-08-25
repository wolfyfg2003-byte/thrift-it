export type WaitlistEntry = {
  email: string;
  mobile: string;
  at: string;
};

const STORAGE_KEY = "thrift-it-waitlist-supabase";

export function readWaitlist(): WaitlistEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as WaitlistEntry).email !== "string" ||
      typeof (parsed as WaitlistEntry).mobile !== "string"
    ) {
      return null;
    }
    return parsed as WaitlistEntry;
  } catch {
    return null;
  }
}

export function saveWaitlist(email: string, mobile: string): WaitlistEntry {
  const entry: WaitlistEntry = {
    email: email.trim().toLowerCase(),
    mobile,
    at: new Date().toISOString(),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  window.dispatchEvent(new Event("thrift-waitlist"));
  return entry;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
