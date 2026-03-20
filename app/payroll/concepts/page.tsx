import { requireCompanyContext } from "@/src/server/auth/context";
import { listCompanyRows } from "@/src/server/payroll/repository";
import { createConceptAction } from "@/src/server/payroll/actions/payroll";
import { Badge, Card, DataTable, PageHeader, SectionGrid } from "@/src/components/payroll/ui";
import { SubmitButton } from "@/src/components/payroll/submit-button";

export default async function PayrollConceptsPage() {
  const context = await requireCompanyContext();
  const concepts = await listCompanyRows("payroll_concepts", context.activeCompanyId!, "priority");

  return (
    <div className="surface-stack">
      <PageHeader
        eyebrow="Conceptos"
        title="Catálogo de conceptos de nómina"
        description="Cada concepto vive por empresa, con vigencias, bases y comportamiento calculable."
      />

      <SectionGrid>
        <Card title="Crear concepto" description="Agrega nuevos conceptos sin tocar el catálogo base sensible.">
          <form className="form-grid" action={createConceptAction}>
            <label>
              Código
              <input type="text" name="code" required />
            </label>
            <label>
              Nombre
              <input type="text" name="name" required />
            </label>
            <label>
              Categoría
              <input type="text" name="category" placeholder="ingresos_salariales" required />
            </label>
            <label>
              Subcategoría
              <input type="text" name="subcategory" placeholder="bonificaciones" />
            </label>
            <label>
              Tipo
              <select name="type" defaultValue="earning">
                <option value="earning">Ingreso</option>
                <option value="deduction">Deducción</option>
                <option value="employer_contribution">Aporte empresa</option>
                <option value="provision">Provisión</option>
                <option value="novelty">Novedad</option>
              </select>
            </label>
            <label className="toggle-card">
              <input type="checkbox" name="salary_constitutive" />
              <div>
                <strong>Constitutivo de salario</strong>
                <span>Impacta IBC y base prestacional.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input type="checkbox" name="requires_days" />
              <div>
                <strong>Requiere días</strong>
                <span>Útil para faltas, incapacidades y vacaciones.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input type="checkbox" name="requires_hours" />
              <div>
                <strong>Requiere horas</strong>
                <span>Útil para extras, recargos y novedades horarias.</span>
              </div>
            </label>
            <div className="inline-actions">
              <SubmitButton label="Crear concepto" pendingLabel="Creando..." />
            </div>
          </form>
        </Card>

        <Card title="Catálogo activo" description="Los conceptos base no eliminables aparecen bloqueados.">
          <DataTable
            columns={["Código", "Nombre", "Tipo", "Base", "Estado"]}
            rows={concepts.map((concept) => [
              concept.code,
              concept.name,
              concept.type,
              concept.salary_constitutive ? <Badge tone="success">Sí</Badge> : <Badge>No</Badge>,
              concept.is_base_concept ? <Badge tone="warning">Base</Badge> : <Badge tone="neutral">Editable</Badge>,
            ])}
          />
        </Card>
      </SectionGrid>
    </div>
  );
}
