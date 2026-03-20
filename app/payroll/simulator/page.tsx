import { requireCompanyContext } from "@/src/server/auth/context";
import { runSimulationAction } from "@/src/server/payroll/actions/payroll";
import { listCompanyRows, listEmployees } from "@/src/server/payroll/repository";
import { Card, DataTable, PageHeader, SectionGrid } from "@/src/components/payroll/ui";
import { SubmitButton } from "@/src/components/payroll/submit-button";
import { formatCurrency } from "@/src/lib/utils";

export default async function SimulatorPage() {
  const context = await requireCompanyContext();
  const [employees, simulations] = await Promise.all([
    listEmployees(context.activeCompanyId!),
    listCompanyRows("payroll_simulations", context.activeCompanyId!, "created_at"),
  ]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="surface-stack">
      <PageHeader eyebrow="Simulador" title="Simulador de liquidación" description="Ejecuta cálculos del lado servidor usando horas extras, novedades, incapacidades, vacaciones y descuentos." />
      <SectionGrid>
        <Card title="Nueva simulación" description="Puedes correr el cálculo para un empleado o para todos.">
          <form className="form-grid" action={runSimulationAction}>
            <label>
              Empleado
              <select name="employee_id" defaultValue="">
                <option value="">Todos</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Período inicial
              <input type="date" name="period_start" defaultValue={`${today.slice(0, 8)}01`} required />
            </label>
            <label>
              Período final
              <input type="date" name="period_end" defaultValue={today} required />
            </label>
            <div className="inline-actions">
              <SubmitButton label="Ejecutar simulación" pendingLabel="Calculando..." />
            </div>
          </form>
        </Card>

        <Card title="Resultados recientes" description="Cada corrida queda persistida con snapshot de entrada y salida.">
          <DataTable
            columns={["Empleado", "Período", "Devengado", "Deducciones", "Neto"]}
            rows={simulations.map((item) => {
              const employee = employees.find((employeeRow) => employeeRow.id === item.employee_id);
              return [
                employee?.full_name || "General",
                `${item.period_start} → ${item.period_end}`,
                formatCurrency(item.total_devengado),
                formatCurrency(item.total_deducciones),
                formatCurrency(item.neto_pagar),
              ];
            })}
          />
        </Card>
      </SectionGrid>
    </div>
  );
}
