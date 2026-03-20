import { requireCompanyContext } from "@/src/server/auth/context";
import { createOvertimeRecordAction } from "@/src/server/payroll/actions/payroll";
import { listCompanyRows, listEmployees } from "@/src/server/payroll/repository";
import { Card, DataTable, PageHeader, SectionGrid } from "@/src/components/payroll/ui";
import { SubmitButton } from "@/src/components/payroll/submit-button";
import { formatNumber } from "@/src/lib/utils";

export default async function OvertimePage() {
  const context = await requireCompanyContext();
  const [employees, records] = await Promise.all([
    listEmployees(context.activeCompanyId!),
    listCompanyRows("overtime_records", context.activeCompanyId!, "work_date"),
  ]);

  return (
    <div className="surface-stack">
      <PageHeader
        eyebrow="Horas extras"
        title="Motor heredado de extras y recargos"
        description="Se conserva la lógica existente, pero ahora los registros viven persistidos y ligados a empresa y empleado."
      />

      <SectionGrid>
        <Card title="Registrar horas" description="Carga manual de horas extras y recargos por día.">
          <form className="form-grid" action={createOvertimeRecordAction}>
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
              Fecha
              <input type="date" name="work_date" required />
            </label>
            <label>
              Extra diurna
              <input type="number" step="0.25" min="0" name="extra_day_hours" defaultValue="0" />
            </label>
            <label>
              Extra nocturna
              <input type="number" step="0.25" min="0" name="extra_night_hours" defaultValue="0" />
            </label>
            <label>
              Recargo nocturno
              <input type="number" step="0.25" min="0" name="night_surcharge_hours" defaultValue="0" />
            </label>
            <label>
              Dominical
              <input type="number" step="0.25" min="0" name="sunday_hours" defaultValue="0" />
            </label>
            <label>
              Festivo
              <input type="number" step="0.25" min="0" name="festive_hours" defaultValue="0" />
            </label>
            <label>
              Dominical nocturno
              <input type="number" step="0.25" min="0" name="sunday_night_hours" defaultValue="0" />
            </label>
            <label>
              Extra dominical diurna
              <input type="number" step="0.25" min="0" name="extra_sunday_day_hours" defaultValue="0" />
            </label>
            <label>
              Extra dominical nocturna
              <input type="number" step="0.25" min="0" name="extra_sunday_night_hours" defaultValue="0" />
            </label>
            <div className="inline-actions">
              <SubmitButton label="Guardar registro" pendingLabel="Guardando..." />
            </div>
          </form>
        </Card>

        <Card title="Histórico reciente" description="Últimos movimientos del módulo de horas extras.">
          <DataTable
            columns={["Fecha", "Empleado", "HED", "HEN", "RN", "DOM/Fest", "Extras DOM"]}
            rows={records.map((record) => {
              const employee = employees.find((item) => item.id === record.employee_id);
              return [
                record.work_date,
                employee?.full_name || record.employee_id,
                formatNumber(record.extra_day_hours),
                formatNumber(record.extra_night_hours),
                formatNumber(record.night_surcharge_hours),
                formatNumber(Number(record.sunday_hours || 0) + Number(record.festive_hours || 0)),
                formatNumber(
                  Number(record.extra_sunday_day_hours || 0) +
                    Number(record.extra_sunday_night_hours || 0),
                ),
              ];
            })}
          />
        </Card>
      </SectionGrid>
    </div>
  );
}
