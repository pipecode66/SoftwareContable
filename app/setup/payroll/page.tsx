import { redirect } from "next/navigation";
import { createCompanyAction, cloneDemoConfigAction, initializeCustomPayrollAction } from "@/src/server/payroll/actions/payroll";
import { requireAuth } from "@/src/server/auth/context";
import { Card, PageHeader } from "@/src/components/payroll/ui";
import { PayrollSetupWizard } from "@/src/components/payroll/setup-wizard";

export default async function PayrollSetupPage() {
  const context = await requireAuth();

  if (context.activeMembership?.companies?.payroll_initialized) {
    redirect("/payroll");
  }

  const hasCompany = Boolean(context.activeMembership?.companies);

  return (
    <main className="setup-shell">
      <section className="setup-card surface-stack">
        <PageHeader
          eyebrow="Onboarding"
          title="Configuración inicial de nómina"
          description="Cada empresa opera con sus propios parámetros, conceptos y reglas. La cuenta demo funciona como plantilla maestra y el resto puede clonarla o configurarse desde cero."
        />

        {!hasCompany ? (
          <Card
            title="Crea tu empresa"
            description="Primero vincula tu cuenta a una empresa para inicializar su configuración de nómina."
          >
            <form className="form-grid" action={createCompanyAction}>
              <label>
                Nombre de la empresa
                <input type="text" name="name" placeholder="Sandeli SAS" required />
              </label>
              <div className="inline-actions" style={{ alignItems: "end" }}>
                <button type="submit" className="primary-button">
                  Crear empresa
                </button>
              </div>
            </form>
          </Card>
        ) : (
          <>
            <Card
              title="Usar configuración general predeterminada"
              description="Clona la plantilla demo completa: conceptos, parámetros legales, cargos, áreas y configuración base."
            >
              <div className="inline-actions">
                <form action={cloneDemoConfigAction}>
                  <button type="submit" className="primary-button">
                    Clonar configuración demo
                  </button>
                </form>
              </div>
            </Card>

            <Card
              title="Personalizar mi sistema"
              description="Abre el wizard para dejar la empresa inicializada con la misma arquitectura, pero ajustada a tu operación."
            >
              <PayrollSetupWizard action={initializeCustomPayrollAction} />
            </Card>
          </>
        )}
      </section>
    </main>
  );
}
