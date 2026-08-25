import { createAdminClient } from "@supabase/server/core";
import type { Database } from "@/lib/supabase/database.types";

export function createThriftAdminClient() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  return createAdminClient<Database>({
    env: {
      url,
      secretKeys: secretKey ? { default: secretKey } : {},
    },
  });
}
