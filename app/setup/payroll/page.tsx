import { redirect } from "next/navigation";
import {
  cloneDemoConfigAction,
  createCompanyAction,
  initializeCustomPayrollAction,
} from "@/src/server/payroll/actions/payroll";
import { requireAuth } from "@/src/server/auth/context";
import { PAYROLL_CONFIGURATION_SECTIONS } from "@/src/server/payroll/configuration";
import { Badge, Card, PageHeader, SectionGrid } from "@/src/components/payroll/ui";
import { PayrollSetupWizard } from "@/src/components/payroll/setup-wizard";

export default async function PayrollSetupPage() {
  const context = await requireAuth();

  if (context.activeMembership?.companies?.payroll_initialized) {
    redirect("/payroll");
  }

  const hasCompany = Boolean(context.activeMembership?.companies);
  const company = context.activeMembership?.companies || null;

  return (
    <main className="setup-shell">
      <section className="setup-card surface-stack">
        <PageHeader
          eyebrow="Onboarding"
          title="Configuración inicial de nómina"
          description="Prepara la operación de tu empresa antes de empezar a liquidar. Desde aquí puedes definir la base de jornada, recargos, seguridad social, novedades, pagos variables, cargos y áreas."
        />

        {!hasCompany ? (
          <Card
            title="Crea tu empresa"
            description="Primero vincula tu cuenta a una empresa para poder habilitar la configuración de nómina."
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
              title={`Empresa activa: ${company?.name ?? "Sin empresa"}`}
              description="Estos son los apartados que quedarán habilitados y configurables en tu cuenta cuando completes la inicialización."
            >
              <SectionGrid>
                {PAYROLL_CONFIGURATION_SECTIONS.map((section) => (
                  <Card
                    key={section.key}
                    title={section.title}
                    description={section.description}
                    className="config-overview-card"
                  >
                    <div className="surface-stack">
                      <Badge tone="warning">Pendiente de configuración</Badge>
                      <p className="muted-copy">
                        Este bloque podrá ajustarse desde tu panel de configuración apenas la
                        empresa quede inicializada.
                      </p>
                    </div>
                  </Card>
                ))}
              </SectionGrid>
            </Card>

            <Card
              title="Usar configuración general predeterminada"
              description="Clona la plantilla demo completa: conceptos, parámetros legales, cargos, áreas y reglas base listas para operar."
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
              description="Completa el asistente para dejar tu empresa configurada con su propio modelo operativo desde el primer ingreso."
            >
              <PayrollSetupWizard action={initializeCustomPayrollAction} />
            </Card>
          </>
        )}
      </section>
    </main>
  );
}
