import { createAdminClient } from "@supabase/server/core";
import { appEnvironment } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Server client for the *active* Supabase project.
 * Isolation is which values sit in SUPABASE_URL / keys — not two URL sets in one process.
 * Teaser (thrifit.ae): waitlist project only.
 * Production (future app): master tables. Flip NEXT_PUBLIC_ENVIRONMENT and the keys.
 */
export function createSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  return createAdminClient<Database>({
    env: {
      url,
      secretKeys: secretKey ? { default: secretKey } : {},
    },
  });
}

export { appEnvironment };
