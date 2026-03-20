import { requireCompanyContext } from "@/src/server/auth/context";
import { createNoveltyAction } from "@/src/server/payroll/actions/payroll";
import { listCompanyRows, listEmployees } from "@/src/server/payroll/repository";
import { Card, DataTable, PageHeader, SectionGrid } from "@/src/components/payroll/ui";
import { SubmitButton } from "@/src/components/payroll/submit-button";
import { formatCurrency, formatNumber } from "@/src/lib/utils";

export default async function NoveltiesPage() {
  const context = await requireCompanyContext();
  const [employees, novelties] = await Promise.all([
    listEmployees(context.activeCompanyId!),
    listCompanyRows("payroll_novelties", context.activeCompanyId!, "date_start"),
  ]);

  return (
    <div className="surface-stack">
      <PageHeader eyebrow="Novedades" title="Registro de novedades" description="Licencias, faltas, permisos y ajustes que impactan la liquidación." />
      <SectionGrid>
        <Card title="Nueva novedad" description="Registra una novedad salarial o no salarial para el período.">
          <form className="form-grid" action={createNoveltyAction}>
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
              <input type="text" name="novelty_type" placeholder="falta_no_justificada" required />
            </label>
            <label>
              Fecha inicial
              <input type="date" name="date_start" required />
            </label>
            <label>
              Fecha final
              <input type="date" name="date_end" required />
            </label>
            <label>
              Días
              <input type="number" step="0.5" min="0" name="days" />
            </label>
            <label>
              Horas
              <input type="number" step="0.25" min="0" name="hours" />
            </label>
            <label>
              Valor
              <input type="number" name="amount" />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Notas
              <textarea name="notes" rows={4} />
            </label>
            <div className="inline-actions">
              <SubmitButton label="Guardar novedad" pendingLabel="Guardando..." />
            </div>
          </form>
        </Card>

        <Card title="Novedades registradas" description="Histórico operativo de novedades por empleado.">
          <DataTable
            columns={["Empleado", "Tipo", "Rango", "Cantidad", "Valor"]}
            rows={novelties.map((item) => {
              const employee = employees.find((employeeItem) => employeeItem.id === item.employee_id);
              return [
                employee?.full_name || item.employee_id,
                item.novelty_type,
                `${item.date_start} → ${item.date_end}`,
                formatNumber(Number(item.days || item.hours || 0)),
                formatCurrency(Number(item.amount || 0)),
              ];
            })}
          />
        </Card>
      </SectionGrid>
    </div>
  );
}
