import { requireCompanyContext } from "@/src/server/auth/context";
import { getPayrollOverview } from "@/src/server/payroll/repository";
import { resetDemoAction } from "@/src/server/payroll/actions/payroll";
import { BarChart, Badge, Card, MetricGrid, PageHeader, SectionGrid } from "@/src/components/payroll/ui";
import { formatCurrency, formatNumber } from "@/src/lib/utils";

export default async function PayrollHomePage() {
  const context = await requireCompanyContext();
  const overview = await getPayrollOverview(context.activeCompanyId!);
  const isDemo = overview.company.is_demo_template || context.profile?.is_demo;

  return (
    <div className="surface-stack">
      <PageHeader
        eyebrow="Resumen ejecutivo"
        title="Centro de control de nómina"
        description="Vista consolidada de la configuración, operación de novedades y trazabilidad del módulo integral de nómina."
      />

      <MetricGrid
        items={[
          {
            label: "Empleados activos",
            value: formatNumber(overview.totals.employees, 0),
            detail: "Vinculados a la empresa activa.",
            tone: "accent",
          },
          {
            label: "Horas extra del mes",
            value: formatNumber(overview.totals.overtimeHoursCurrentMonth),
            detail: "Suma de registros operativos del período.",
            tone: "magenta",
          },
          {
            label: "Novedades registradas",
            value: formatNumber(overview.totals.novelties, 0),
            detail: "Incluye faltas, licencias y otros eventos.",
            tone: "slate",
          },
          {
            label: "Eventos de auditoría",
            value: formatNumber(overview.totals.auditEvents, 0),
            detail: "Historial total de cambios sobre la empresa.",
          },
        ]}
      />

      <SectionGrid>
        <BarChart
          title="Horas extras por mes"
          subtitle="Seguimiento del motor heredado de extras y recargos, ahora persistido en Supabase."
          data={overview.charts.overtimeByMonth}
        />
        <BarChart
          title="Empleados por cargo"
          subtitle="Distribución del equipo actual por estructura organizacional."
          data={overview.charts.employeesByPosition}
        />
      </SectionGrid>

      <SectionGrid>
        <Card title="Estado del tenant" description="Resumen funcional de la empresa activa.">
          <div className="surface-stack">
            <div className="inline-actions">
              <Badge tone="success">
                {overview.company.payroll_initialized ? "Nómina inicializada" : "Pendiente"}
              </Badge>
              {isDemo ? <Badge tone="accent">Modo demostración</Badge> : null}
            </div>
            <p className="muted-copy">
              La empresa tiene {formatNumber(overview.totals.positions, 0)} cargos,
              {" "}
              {formatNumber(overview.totals.departments, 0)} áreas,
              {" "}
              {formatNumber(overview.totals.concepts, 0)} conceptos y
              {" "}
              {formatNumber(overview.totals.pendingSimulations, 0)} simulaciones en borrador.
            </p>
            {isDemo ? (
              <form action={resetDemoAction}>
                <button type="submit" className="secondary-button">
                  Restablecer demo
                </button>
              </form>
            ) : null}
          </div>
        </Card>

        <Card title="Costo extraordinario estimado" description="Lectura rápida de la capa actual.">
          <div className="surface-stack">
            <p className="muted-copy">
              La cuenta demo y las empresas clonadas podrán usar este tablero como base para
              liquidación, costos adicionales y consolidado histórico por períodos.
            </p>
            <div className="metric-grid">
              <article className="metric-card">
                <span>Simulaciones generadas</span>
                <strong>{formatNumber(overview.readModel.simulations.length, 0)}</strong>
                <small>Acumulado persistente en Supabase.</small>
              </article>
              <article className="metric-card">
                <span>Descuentos adicionales</span>
                <strong>{formatCurrency(
                  overview.readModel.additionalDeductions.reduce(
                    (total, item) => total + Number(item.amount || 0),
                    0,
                  ),
                )}</strong>
                <small>Valor consolidado de descuentos manuales.</small>
              </article>
            </div>
          </div>
        </Card>
      </SectionGrid>
    </div>
  );
}
