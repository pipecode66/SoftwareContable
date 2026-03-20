import { redirect } from "next/navigation";
import { getAuthContext } from "@/src/server/auth/context";
import { isSupabaseConfigured } from "@/src/lib/supabase/env";

export default async function HomePage() {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=Configura%20las%20variables%20de%20Supabase");
  }

  const context = await getAuthContext();
  if (!context) {
    redirect("/login");
  }

  redirect(context.activeCompanyId ? "/payroll" : "/setup/payroll");
}
