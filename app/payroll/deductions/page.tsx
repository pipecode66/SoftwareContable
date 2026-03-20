import { requireCompanyContext } from "@/src/server/auth/context";
import { createDeductionAction } from "@/src/server/payroll/actions/payroll";
import { listCompanyRows, listEmployees } from "@/src/server/payroll/repository";
import { Card, DataTable, PageHeader, SectionGrid } from "@/src/components/payroll/ui";
import { SubmitButton } from "@/src/components/payroll/submit-button";
import { formatCurrency } from "@/src/lib/utils";

export default async function DeductionsPage() {
  const context = await requireCompanyContext();
  const [employees, deductions] = await Promise.all([
    listEmployees(context.activeCompanyId!),
    listCompanyRows("additional_deductions", context.activeCompanyId!, "applies_from"),
  ]);

  return (
    <div className="surface-stack">
      <PageHeader eyebrow="Descuentos" title="Descuentos adicionales" description="Gestiona libranzas, préstamos, embargos y descuentos manuales por empleado." />
      <SectionGrid>
        <Card title="Nuevo descuento" description="Los descuentos quedan trazados y pueden ser recurrentes o puntuales.">
          <form className="form-grid" action={createDeductionAction}>
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
              Concepto
              <input type="text" name="concept_name" required />
            </label>
            <label>
              Valor
              <input type="number" name="amount" min="1" required />
            </label>
            <label>
              Recurrencia
              <select name="recurrence" defaultValue="one_off">
                <option value="one_off">Una sola vez</option>
                <option value="monthly">Mensual</option>
                <option value="biweekly">Quincenal</option>
              </select>
            </label>
            <label>
              Desde
              <input type="date" name="applies_from" required />
            </label>
            <label>
              Hasta
              <input type="date" name="applies_to" />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Notas
              <textarea name="notes" rows={4} />
            </label>
            <div className="inline-actions">
              <SubmitButton label="Guardar descuento" pendingLabel="Guardando..." />
            </div>
          </form>
        </Card>

        <Card title="Descuentos vigentes" description="Histórico de descuentos adicionales por empleado.">
          <DataTable
            columns={["Empleado", "Concepto", "Recurrencia", "Desde", "Hasta", "Valor"]}
            rows={deductions.map((item) => {
              const employee = employees.find((employeeRow) => employeeRow.id === item.employee_id);
              return [
                employee?.full_name || item.employee_id,
                item.concept_name,
                item.recurrence,
                item.applies_from,
                item.applies_to || "-",
                formatCurrency(item.amount),
              ];
            })}
          />
        </Card>
      </SectionGrid>
    </div>
  );
}
