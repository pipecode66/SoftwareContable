import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireCompanyContext } from "@/src/server/auth/context";
import { PayrollShell } from "@/src/components/payroll/shell";

export default async function PayrollLayout({
  children,
}: {
  children: ReactNode;
}) {
  const context = await requireCompanyContext();

  if (!context.activeMembership?.companies?.payroll_initialized) {
    redirect("/setup/payroll");
  }

  return <PayrollShell context={context}>{children}</PayrollShell>;
}
