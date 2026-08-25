"use server";

import { isValidEmail } from "@/lib/waitlist-store";
import { createThriftAdminClient } from "@/lib/supabase/admin";

export type WaitlistError = "already_registered" | "unknown";

export type WaitlistResult =
  | { success: true }
  | { success: false; error: WaitlistError };

export async function addToWaitlist(
  email: string,
  phone?: string | null,
): Promise<WaitlistResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone?.trim() ? phone.trim() : null;

  if (!isValidEmail(normalizedEmail)) {
    return { success: false, error: "unknown" };
  }

  try {
    const supabase = createThriftAdminClient();
    const { error } = await supabase.from("waitlist").insert({
      email: normalizedEmail,
      phone: normalizedPhone,
    });

    if (!error) {
      return { success: true };
    }

    if (error.code === "23505") {
      return { success: false, error: "already_registered" };
    }

    console.error("waitlist insert failed", error.code, error.message);
    return { success: false, error: "unknown" };
  } catch (cause) {
    console.error("waitlist insert threw", cause);
    return { success: false, error: "unknown" };
  }
}
