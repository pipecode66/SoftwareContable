"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/src/server/payroll/actions/auth";
import { Badge } from "@/src/components/payroll/ui";
import type { AuthContext } from "@/src/server/auth/context";

const NAV_ITEMS = [
  { href: "/payroll", label: "Resumen" },
  { href: "/payroll/settings", label: "Configuración" },
  { href: "/payroll/concepts", label: "Conceptos" },
  { href: "/payroll/legal-parameters", label: "Parámetros legales" },
  { href: "/payroll/employees", label: "Empleados" },
  { href: "/payroll/positions", label: "Cargos" },
  { href: "/payroll/departments", label: "Áreas" },
  { href: "/payroll/overtime", label: "Horas extras" },
  { href: "/payroll/novelties", label: "Novedades" },
  { href: "/payroll/incapacities", label: "Incapacidades" },
  { href: "/payroll/vacations", label: "Vacaciones" },
  { href: "/payroll/deductions", label: "Descuentos" },
  { href: "/payroll/simulator", label: "Simulador" },
  { href: "/payroll/audit", label: "Auditoría" },
];

export function PayrollShell({
  context,
  children,
}: {
  context: AuthContext;
  children: ReactNode;
}) {
  const pathname = usePathname();
  if (!context.activeMembership?.companies) return null;

  const company = context.activeMembership.companies;

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-stack">
          <div className="sidebar-brand">
            <div className="logo-mark">K</div>
            <div>
              <p className="eyebrow">KAIKO Payroll</p>
              <h2>{company.name}</h2>
            </div>
          </div>

          <div className="sidebar-company">
            {company.is_demo_template ? <Badge tone="accent">Modo demostración</Badge> : null}
            <span>{context.email}</span>
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${pathname === item.href ? "active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <form action={signOutAction} className="sidebar-footer">
            <button type="submit" className="secondary-button full-width">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
