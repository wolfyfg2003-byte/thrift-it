"use server";

import { isProduction } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabaseClient";
import type { ShippingAddress } from "@/lib/uae-address";

export type ProfileActionResult =
  | { ok: true; skipped?: "teaser" | "no_session" }
  | { ok: false; error: string };

async function readSessionUserId(): Promise<string | null> {
  return null;
}

export async function saveShippingAddress(
  address: ShippingAddress,
): Promise<ProfileActionResult> {
  if (!isProduction()) return { ok: true, skipped: "teaser" };

  const userId = await readSessionUserId();
  if (!userId) return { ok: true, skipped: "no_session" };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      phone: address.mobile,
      community: address.community,
      shipping_address: address,
    })
    .eq("id", userId);

  if (error) {
    console.error("saveShippingAddress failed", error.message);
    return { ok: false, error: "Could not save shipping address." };
  }
  return { ok: true };
}
