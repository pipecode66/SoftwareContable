import { requireCompanyContext } from "@/src/server/auth/context";
import { getPayrollSettings } from "@/src/server/payroll/repository";
import { upsertPayrollSettingsAction } from "@/src/server/payroll/actions/payroll";
import { Card, PageHeader } from "@/src/components/payroll/ui";
import { SubmitButton } from "@/src/components/payroll/submit-button";

export default async function PayrollSettingsPage() {
  const context = await requireCompanyContext();
  const settings = await getPayrollSettings(context.activeCompanyId!);

  return (
    <div className="surface-stack">
      <PageHeader
        eyebrow="Configuración"
        title="Configuración general de nómina"
        description="Define frecuencia, jornada de referencia y activación de los módulos base para la empresa actual."
      />

      <Card title="Parámetros base" description="Estos ajustes alimentan el motor de cálculo y la inicialización de cada liquidación.">
        <form className="form-grid" action={upsertPayrollSettingsAction}>
          <label>
            Frecuencia
            <select name="payroll_frequency" defaultValue={settings?.payroll_frequency ?? "quincenal"}>
              <option value="quincenal">Quincenal</option>
              <option value="mensual">Mensual</option>
              <option value="semanal">Semanal</option>
            </select>
          </label>
          <label>
            Horas máximas semanales
            <input
              type="number"
              min="1"
              name="weekly_max_hours"
              defaultValue={settings?.weekly_max_hours ?? 46}
            />
          </label>
          <label>
            Inicio jornada diurna
            <input type="time" name="daytime_start" defaultValue={settings?.daytime_start ?? "06:00"} />
          </label>
          <label>
            Fin jornada diurna
            <input type="time" name="daytime_end" defaultValue={settings?.daytime_end ?? "21:00"} />
          </label>
          <label>
            Inicio jornada nocturna
            <input type="time" name="night_start" defaultValue={settings?.night_start ?? "21:00"} />
          </label>
          <label className="toggle-card">
            <input type="checkbox" name="overtime_enabled" defaultChecked={settings?.overtime_enabled ?? true} />
            <div>
              <strong>Horas extras activas</strong>
              <span>Permite usar el módulo heredado de extras y recargos.</span>
            </div>
          </label>
          <label className="toggle-card">
            <input
              type="checkbox"
              name="social_security_enabled"
              defaultChecked={settings?.social_security_enabled ?? true}
            />
            <div>
              <strong>Seguridad social</strong>
              <span>Calcula salud y pensión por defecto.</span>
            </div>
          </label>
          <label className="toggle-card">
            <input
              type="checkbox"
              name="parafiscals_enabled"
              defaultChecked={settings?.parafiscals_enabled ?? true}
            />
            <div>
              <strong>Parafiscales</strong>
              <span>Activa caja, ICBF y SENA por empresa.</span>
            </div>
          </label>
          <label className="toggle-card">
            <input
              type="checkbox"
              name="benefits_enabled"
              defaultChecked={settings?.benefits_enabled ?? true}
            />
            <div>
              <strong>Prestaciones</strong>
              <span>Calcula provisiones de cesantías, prima y vacaciones.</span>
            </div>
          </label>
          <label className="toggle-card">
            <input
              type="checkbox"
              name="transport_allowance_enabled"
              defaultChecked={settings?.transport_allowance_enabled ?? true}
            />
            <div>
              <strong>Auxilio de transporte</strong>
              <span>Mantiene el concepto disponible y calculable.</span>
            </div>
          </label>
          <div className="inline-actions">
            <SubmitButton label="Guardar configuración" pendingLabel="Guardando..." />
          </div>
        </form>
      </Card>
    </div>
  );
}
