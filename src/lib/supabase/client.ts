import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/src/lib/supabase/types";
import { assertSupabaseEnv } from "@/src/lib/supabase/env";

export function createClient() {
  const { url, key } = assertSupabaseEnv();
  return createBrowserClient<Database>(url, key);
}
