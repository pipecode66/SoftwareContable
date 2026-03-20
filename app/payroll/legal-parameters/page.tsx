import { requireCompanyContext } from "@/src/server/auth/context";
import { listLegalParameters } from "@/src/server/payroll/repository";
import { createLegalParameterAction } from "@/src/server/payroll/actions/payroll";
import { Card, DataTable, PageHeader, SectionGrid } from "@/src/components/payroll/ui";
import { SubmitButton } from "@/src/components/payroll/submit-button";

export default async function PayrollLegalParametersPage() {
  const context = await requireCompanyContext();
  const parameters = await listLegalParameters(context.activeCompanyId!);

  return (
    <div className="surface-stack">
      <PageHeader
        eyebrow="Parámetros legales"
        title="Parámetros legales versionados"
        description="Sin porcentajes quemados en componentes. Cada valor tiene vigencia y puede sobrescribirse por empresa."
      />

      <SectionGrid>
        <Card title="Nuevo parámetro" description="Crea o agrega una nueva versión de un parámetro legal.">
          <form className="form-grid" action={createLegalParameterAction}>
            <label>
              Clave
              <input type="text" name="key" placeholder="auxilio_transporte" required />
            </label>
            <label>
              Nombre
              <input type="text" name="name" placeholder="Auxilio de transporte" required />
            </label>
            <label>
              Tipo de valor
              <select name="value_type" defaultValue="number">
                <option value="number">Número</option>
                <option value="percentage">Porcentaje</option>
                <option value="json">JSON</option>
              </select>
            </label>
            <label>
              Vigente desde
              <input type="date" name="valid_from" required />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Descripción
              <textarea name="description" rows={3} />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Payload JSON
              <textarea name="payload" rows={5} defaultValue='{"amount": 200000}' required />
            </label>
            <div className="inline-actions">
              <SubmitButton label="Guardar parámetro" pendingLabel="Guardando..." />
            </div>
          </form>
        </Card>

        <Card title="Parámetros activos" description="Vista rápida de las últimas versiones vigentes.">
          <DataTable
            columns={["Clave", "Nombre", "Empresa", "Última versión", "Valor"]}
            rows={parameters.map((parameter) => {
              const latest = parameter.legal_parameter_versions[0];
              return [
                parameter.key,
                parameter.name,
                parameter.company_id ? "Empresa" : "Global",
                latest?.valid_from || "-",
                latest ? JSON.stringify(latest.value) : "-",
              ];
            })}
          />
        </Card>
      </SectionGrid>
    </div>
  );
}
