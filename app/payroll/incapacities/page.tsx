import { requireCompanyContext } from "@/src/server/auth/context";
import { createIncapacityAction } from "@/src/server/payroll/actions/payroll";
import { listCompanyRows, listEmployees } from "@/src/server/payroll/repository";
import { Card, DataTable, PageHeader, SectionGrid } from "@/src/components/payroll/ui";
import { SubmitButton } from "@/src/components/payroll/submit-button";
import { formatNumber } from "@/src/lib/utils";

export default async function IncapacitiesPage() {
  const context = await requireCompanyContext();
  const [employees, incapacities] = await Promise.all([
    listEmployees(context.activeCompanyId!),
    listCompanyRows("incapacity_records", context.activeCompanyId!, "start_date"),
  ]);

  return (
    <div className="surface-stack">
      <PageHeader eyebrow="Incapacidades" title="Gestión de incapacidades" description="Registra incapacidades con tipo, origen, porcentaje y responsable de pago." />
      <SectionGrid>
        <Card title="Nueva incapacidad" description="El soporte documental puede adjuntarse luego vía Storage.">
          <form className="form-grid" action={createIncapacityAction}>
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
              <input type="text" name="incapacity_type" placeholder="enfermedad_general" required />
            </label>
            <label>
              Origen
              <input type="text" name="origin" placeholder="EPS" required />
            </label>
            <label>
              Responsable pago
              <input type="text" name="payer_responsible" placeholder="empresa" required />
            </label>
            <label>
              Inicio
              <input type="date" name="start_date" required />
            </label>
            <label>
              Fin
              <input type="date" name="end_date" required />
            </label>
            <label>
              Días
              <input type="number" step="0.5" name="days" min="0.5" required />
            </label>
            <label>
              % pago
              <input type="number" step="0.01" name="payment_percentage" min="0" required />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Notas
              <textarea name="notes" rows={4} />
            </label>
            <div className="inline-actions">
              <SubmitButton label="Guardar incapacidad" pendingLabel="Guardando..." />
            </div>
          </form>
        </Card>

        <Card title="Incapacidades" description="Registros persistidos por empresa y empleado.">
          <DataTable
            columns={["Empleado", "Tipo", "Origen", "Rango", "Días", "%"]}
            rows={incapacities.map((item) => {
              const employee = employees.find((employeeRow) => employeeRow.id === item.employee_id);
              return [
                employee?.full_name || item.employee_id,
                item.incapacity_type,
                item.origin,
                `${item.start_date} → ${item.end_date}`,
                formatNumber(item.days),
                `${formatNumber(item.payment_percentage)}%`,
              ];
            })}
          />
        </Card>
      </SectionGrid>
    </div>
  );
}
