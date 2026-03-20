import { requireCompanyContext } from "@/src/server/auth/context";
import { deleteEmployeeAction, upsertEmployeeAction } from "@/src/server/payroll/actions/payroll";
import { listCompanyRows, listEmployees } from "@/src/server/payroll/repository";
import { Badge, Card, DataTable, PageHeader } from "@/src/components/payroll/ui";
import { SubmitButton } from "@/src/components/payroll/submit-button";
import { formatCurrency } from "@/src/lib/utils";

export default async function EmployeesPage() {
  const context = await requireCompanyContext();
  const [employees, positions, departments] = await Promise.all([
    listEmployees(context.activeCompanyId!),
    listCompanyRows("positions", context.activeCompanyId!, "name"),
    listCompanyRows("departments", context.activeCompanyId!, "name"),
  ]);

  return (
    <div className="surface-stack">
      <PageHeader
        eyebrow="Empleados"
        title="Gestión de empleados"
        description="La ficha del empleado conserva salario, ingreso, contrato y base para liquidación."
      />

      <Card title="Crear o actualizar empleado" description="Cada empleado queda asociado a cargo, área y configuración contractual.">
        <form className="form-grid" action={upsertEmployeeAction}>
          <label>
            Nombres
            <input type="text" name="first_name" required />
          </label>
          <label>
            Apellidos
            <input type="text" name="last_name" required />
          </label>
          <label>
            Documento
            <input type="text" name="document_number" required />
          </label>
          <label>
            Tipo documento
            <input type="text" name="document_type" defaultValue="CC" />
          </label>
          <label>
            Correo
            <input type="email" name="email" />
          </label>
          <label>
            Teléfono
            <input type="text" name="phone" />
          </label>
          <label>
            Fecha de admisión
            <input type="date" name="admission_date" required />
          </label>
          <label>
            Cargo
            <select name="position_id" defaultValue="">
              <option value="">Selecciona</option>
              {positions.map((position) => (
                <option key={position.id} value={position.id}>
                  {position.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Área
            <select name="department_id" defaultValue="">
              <option value="">Selecciona</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Salario base
            <input type="number" name="base_salary" min="0" required />
          </label>
          <label>
            Horas semanales
            <input type="number" name="weekly_hours" min="1" defaultValue="46" required />
          </label>
          <label>
            Día de descanso
            <input type="text" name="rest_day" placeholder="domingo" />
          </label>
          <label>
            Estado
            <select name="status" defaultValue="active">
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </label>
          <label>
            Tipo de contrato
            <select name="contract_type" defaultValue="termino_indefinido">
              <option value="termino_indefinido">Término indefinido</option>
              <option value="termino_fijo">Término fijo</option>
              <option value="manejo_confianza">Manejo y confianza</option>
              <option value="sin_contrato">Sin contrato</option>
            </select>
          </label>
          <label>
            Periodicidad de pago
            <select name="payment_frequency" defaultValue="quincenal">
              <option value="quincenal">Quincenal</option>
              <option value="mensual">Mensual</option>
              <option value="semanal">Semanal</option>
            </select>
          </label>
          <label>
            Auxilio de transporte
            <input type="number" name="transport_allowance" min="0" defaultValue="0" />
          </label>
          <label>
            Bono mensual
            <input type="number" name="bonus_amount" min="0" defaultValue="0" />
          </label>
          <label>
            Clase de riesgo ARL
            <input type="number" name="arl_risk_class" min="1" max="5" defaultValue="1" />
          </label>
          <div className="inline-actions">
            <SubmitButton label="Guardar empleado" pendingLabel="Guardando..." />
          </div>
        </form>
      </Card>

      <Card title="Empleados actuales" description="Vista del equipo cargado en la empresa activa.">
        <DataTable
          columns={["Empleado", "Cargo", "Área", "Salario", "Hora", "Estado", "Acción"]}
          rows={employees.map((employee) => [
            employee.full_name,
            employee.positions?.name || "-",
            employee.departments?.name || "-",
            formatCurrency(employee.base_salary),
            formatCurrency(employee.hourly_value || 0),
            employee.status === "active" ? <Badge tone="success">Activo</Badge> : <Badge>Inactivo</Badge>,
            <form action={deleteEmployeeAction} key={employee.id}>
              <input type="hidden" name="id" value={employee.id} />
              <button type="submit" className="secondary-button">
                Eliminar
              </button>
            </form>,
          ])}
        />
      </Card>
    </div>
  );
}
