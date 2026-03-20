import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import type { AppRole, Database } from "@/src/lib/supabase/types";
import { isSupabaseConfigured } from "@/src/lib/supabase/env";

type CompanyMembership =
  Database["public"]["Tables"]["company_users"]["Row"] & {
    companies: Database["public"]["Tables"]["companies"]["Row"] | null;
  };

export type AuthContext = {
  userId: string;
  email: string;
  profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  memberships: CompanyMembership[];
  activeMembership: CompanyMembership | null;
  activeCompanyId: string | null;
  activeRole: AppRole | null;
};

export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { data: memberships } = await supabase
    .from("company_users")
    .select("*, companies(*)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const typedMemberships = (memberships ?? []) as CompanyMembership[];
  const activeMembership =
    typedMemberships.find((item) => item.company_id === profile?.default_company_id) ||
    typedMemberships[0] ||
    null;

  return {
    userId: user.id,
    email: user.email ?? "",
    profile: profile ?? null,
    memberships: typedMemberships,
    activeMembership,
    activeCompanyId: activeMembership?.company_id ?? null,
    activeRole: activeMembership?.role ?? null,
  };
});

export async function requireAuth() {
  const context = await getAuthContext();

  if (!context) {
    redirect("/login");
  }

  return context;
}

export async function requireCompanyContext() {
  const context = await requireAuth();

  if (!context.activeCompanyId) {
    redirect("/setup/payroll");
  }

  return context;
}
