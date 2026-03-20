import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/src/lib/supabase/types";
import {
  assertSupabaseEnv,
  getSupabaseServiceRoleKey,
} from "@/src/lib/supabase/env";

export function createAdminClient() {
  const { url } = assertSupabaseEnv();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!serviceRoleKey) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY para operaciones administrativas.");
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
