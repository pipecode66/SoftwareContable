import { requireCompanyContext } from "@/src/server/auth/context";
import { createVacationAction } from "@/src/server/payroll/actions/payroll";
import { listCompanyRows, listEmployees } from "@/src/server/payroll/repository";
import { Card, DataTable, PageHeader, SectionGrid } from "@/src/components/payroll/ui";
import { SubmitButton } from "@/src/components/payroll/submit-button";
import { formatCurrency, formatNumber } from "@/src/lib/utils";

export default async function VacationsPage() {
  const context = await requireCompanyContext();
  const [employees, vacations] = await Promise.all([
    listEmployees(context.activeCompanyId!),
    listCompanyRows("vacation_records", context.activeCompanyId!, "start_date"),
  ]);

  return (
    <div className="surface-stack">
      <PageHeader eyebrow="Vacaciones" title="Control de vacaciones" description="Administra vacaciones causadas, disfrutadas, programadas y pagadas." />
      <SectionGrid>
        <Card title="Nuevo registro" description="Crea movimientos de vacaciones por empleado.">
          <form className="form-grid" action={createVacationAction}>
            <label>
              Empleado
              <select name="employee_id" defaultValue="" required>
                <option value="">Selecciona</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tipo
              <select name="record_type" defaultValue="causadas">
                <option value="causadas">Causadas</option>
                <option value="disfrutadas">Disfrutadas</option>
                <option value="programadas">Programadas</option>
                <option value="pagadas">Pagadas</option>
              </select>
            </label>
            <label>
              Inicio
              <input type="date" name="start_date" />
            </label>
            <label>
              Fin
              <input type="date" name="end_date" />
            </label>
            <label>
              Días
              <input type="number" step="0.5" min="0" name="days" defaultValue="0" />
            </label>
            <label>
              Disfrutados
              <input type="number" step="0.5" min="0" name="enjoyed_days" defaultValue="0" />
            </label>
            <label>
              Pendientes
              <input type="number" step="0.5" min="0" name="pending_days" defaultValue="0" />
            </label>
            <label>
              Valor pagado
              <input type="number" min="0" name="paid_amount" />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Notas
              <textarea name="notes" rows={4} />
            </label>
            <div className="inline-actions">
              <SubmitButton label="Guardar vacaciones" pendingLabel="Guardando..." />
            </div>
          </form>
        </Card>

        <Card title="Histórico" description="Seguimiento de saldos y pagos de vacaciones.">
          <DataTable
            columns={["Empleado", "Tipo", "Días", "Disfrutados", "Pendientes", "Valor"]}
            rows={vacations.map((item) => {
              const employee = employees.find((employeeRow) => employeeRow.id === item.employee_id);
              return [
                employee?.full_name || item.employee_id,
                item.record_type,
                formatNumber(item.days),
                formatNumber(item.enjoyed_days),
                formatNumber(item.pending_days),
                formatCurrency(Number(item.paid_amount || 0)),
              ];
            })}
          />
        </Card>
      </SectionGrid>
    </div>
  );
}
