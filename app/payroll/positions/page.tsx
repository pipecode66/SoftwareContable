import { requireCompanyContext } from "@/src/server/auth/context";
import { deletePositionAction, upsertPositionAction } from "@/src/server/payroll/actions/payroll";
import { listCompanyRows } from "@/src/server/payroll/repository";
import { Card, DataTable, PageHeader, SectionGrid } from "@/src/components/payroll/ui";
import { SubmitButton } from "@/src/components/payroll/submit-button";

export default async function PositionsPage() {
  const context = await requireCompanyContext();
  const positions = await listCompanyRows("positions", context.activeCompanyId!, "name");

  return (
    <div className="surface-stack">
      <PageHeader eyebrow="Cargos" title="Catálogo de cargos" description="Define cargos parametrizables por empresa." />
      <SectionGrid>
        <Card title="Crear cargo" description="Los cargos permiten jerarquías y reglas posteriores por rol.">
          <form className="form-grid" action={upsertPositionAction}>
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
              <SubmitButton label="Guardar cargo" pendingLabel="Guardando..." />
            </div>
          </form>
        </Card>

        <Card title="Cargos actuales" description="Listado vivo de cargos por empresa.">
          <DataTable
            columns={["Código", "Nombre", "Descripción", "Acción"]}
            rows={positions.map((position) => [
              position.code,
              position.name,
              position.description || "-",
              <form action={deletePositionAction} key={position.id}>
                <input type="hidden" name="id" value={position.id} />
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
