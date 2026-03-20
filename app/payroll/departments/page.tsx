import { requireCompanyContext } from "@/src/server/auth/context";
import { deleteDepartmentAction, upsertDepartmentAction } from "@/src/server/payroll/actions/payroll";
import { listCompanyRows } from "@/src/server/payroll/repository";
import { Card, DataTable, PageHeader, SectionGrid } from "@/src/components/payroll/ui";
import { SubmitButton } from "@/src/components/payroll/submit-button";

export default async function DepartmentsPage() {
  const context = await requireCompanyContext();
  const departments = await listCompanyRows("departments", context.activeCompanyId!, "name");

  return (
    <div className="surface-stack">
      <PageHeader eyebrow="Áreas" title="Áreas de la empresa" description="Define la estructura organizacional por áreas o departamentos." />
      <SectionGrid>
        <Card title="Crear área" description="Crea áreas reutilizables para empleados y reportes.">
          <form className="form-grid" action={upsertDepartmentAction}>
            <label>
              Código
              <input type="text" name="code" required />
            </label>
            <label>
              Nombre
              <input type="text" name="name" required />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Descripción
              <textarea name="description" rows={4} />
            </label>
            <div className="inline-actions">
              <SubmitButton label="Guardar área" pendingLabel="Guardando..." />
            </div>
          </form>
        </Card>

        <Card title="Áreas actuales" description="Listado vivo de áreas por empresa.">
          <DataTable
            columns={["Código", "Nombre", "Descripción", "Acción"]}
            rows={departments.map((department) => [
              department.code,
              department.name,
              department.description || "-",
              <form action={deleteDepartmentAction} key={department.id}>
                <input type="hidden" name="id" value={department.id} />
                <button type="submit" className="secondary-button">
                  Eliminar
                </button>
              </form>,
            ])}
          />
        </Card>
      </SectionGrid>
    </div>
  );
}
