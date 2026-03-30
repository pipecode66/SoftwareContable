import { requireCompanyContext } from "@/src/server/auth/context";
import { getPayrollReadModel, getPayrollSettings } from "@/src/server/payroll/repository";
import {
  PAYROLL_CONFIGURATION_SECTIONS,
  resolvePayrollSettingsConfig,
} from "@/src/server/payroll/configuration";
import {
  updatePayrollConfigurationSectionAction,
  upsertPayrollSettingsAction,
} from "@/src/server/payroll/actions/payroll";
import {
  Badge,
  Card,
  MetricGrid,
  PageHeader,
  SectionGrid,
} from "@/src/components/payroll/ui";
import { SubmitButton } from "@/src/components/payroll/submit-button";

export default async function PayrollSettingsPage() {
  const context = await requireCompanyContext();
  const [settings, readModel] = await Promise.all([
    getPayrollSettings(context.activeCompanyId!),
    getPayrollReadModel(context.activeCompanyId!),
  ]);

  const config = resolvePayrollSettingsConfig(settings?.config);

  return (
    <div className="surface-stack">
      <PageHeader
        eyebrow="Configuración"
        title="Centro de configuración de nómina"
        description="Desde esta vista puedes revisar y ajustar la base operativa completa de la empresa: jornada, horas extras, aportes, prestaciones, novedades, compensación y estructura organizacional."
        actions={[
          { href: "/payroll/concepts", label: "Conceptos" },
          { href: "/payroll/legal-parameters", label: "Parámetros legales" },
          { href: "/payroll/employees", label: "Empleados" },
        ]}
      />

      <MetricGrid
        items={[
          {
            label: "Conceptos activos",
            value: String(readModel.concepts.length),
            detail: "Catálogo disponible para la empresa.",
            tone: "accent",
          },
          {
            label: "Parámetros legales",
            value: String(readModel.legalParameters.length),
            detail: "Valores y vigencias cargadas.",
            tone: "magenta",
          },
          {
            label: "Cargos y áreas",
            value: `${readModel.positions.length} / ${readModel.departments.length}`,
            detail: "Estructura organizacional activa.",
            tone: "slate",
          },
          {
            label: "Empleados configurados",
            value: String(readModel.employees.length),
            detail: "Personal vinculado a la empresa.",
          },
        ]}
      />

      <Card
        title="Mapa de configuración"
        description="Resumen rápido de todos los apartados configurables para esta empresa."
      >
        <SectionGrid>
          {PAYROLL_CONFIGURATION_SECTIONS.map((section) => (
            <Card
              key={section.key}
              title={section.title}
              description={section.description}
              className="config-overview-card"
            >
              <div className="surface-stack">
                <Badge tone="success">Configurado</Badge>
                {section.route ? (
                  <a className="ghost-link" href={section.route}>
                    Abrir módulo
                  </a>
                ) : null}
              </div>
            </Card>
          ))}
        </SectionGrid>
      </Card>

      <SectionGrid>
        <Card
          title="Jornada y operación base"
          description="Frecuencia de nómina, topes semanales y reglas generales de la jornada."
        >
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
                <span>Permite usar el motor heredado de extras y recargos.</span>
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
                <span>Activa salud y pensión en la liquidación.</span>
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
                <span>Habilita caja, ICBF y SENA.</span>
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
                <span>Mantiene las provisiones prestacionales activas.</span>
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
                <span>Deja el auxilio listo para cálculo automático.</span>
              </div>
            </label>
            <div className="inline-actions">
              <SubmitButton label="Guardar parámetros base" pendingLabel="Guardando..." />
            </div>
          </form>
        </Card>

        <Card
          title="Resumen operativo actual"
          description="Lectura rápida de las decisiones activas por empresa."
        >
          <div className="surface-stack">
            <div className="inline-actions">
              <Badge tone={config.modules.overtime.enabled ? "success" : "warning"}>
                Extras {config.modules.overtime.enabled ? "activas" : "inactivas"}
              </Badge>
              <Badge tone={config.modules.social_security.enabled ? "success" : "warning"}>
                Seguridad social {config.modules.social_security.enabled ? "activa" : "inactiva"}
              </Badge>
              <Badge tone={config.modules.benefits.enabled ? "success" : "warning"}>
                Prestaciones {config.modules.benefits.enabled ? "activas" : "inactivas"}
              </Badge>
            </div>
            <p className="muted-copy">
              Jornada {config.modules.company.workdayType}, corte {config.modules.company.periodCutoff},
              tope diario de extras de {config.modules.overtime.dailyCapHours} horas y ARL por defecto
              clase {config.modules.social_security.defaultArlRiskClass}.
            </p>
            <p className="muted-copy">
              Los catálogos de cargos, áreas, conceptos y parámetros legales pueden ajustarse desde
              sus módulos especializados sin romper esta configuración base.
            </p>
          </div>
        </Card>
      </SectionGrid>

      <SectionGrid>
        <Card
          title="Horas extras y recargos"
          description="Define cómo opera el reconocimiento de extras, recargos nocturnos, dominicales y festivos."
        >
          <form className="form-grid" action={updatePayrollConfigurationSectionAction}>
            <input type="hidden" name="section_key" value="overtime" />
            <label className="toggle-card">
              <input
                type="checkbox"
                name="overtime_enabled"
                defaultChecked={config.modules.overtime.enabled}
              />
              <div>
                <strong>Horas extras activas</strong>
                <span>Control general del módulo de extras.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="overtime_requires_authorization"
                defaultChecked={config.modules.overtime.requiresAuthorization}
              />
              <div>
                <strong>Requiere autorización</strong>
                <span>Solicita aprobación para reconocer extras.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="overtime_night_surcharge_enabled"
                defaultChecked={config.modules.overtime.nightSurchargeEnabled}
              />
              <div>
                <strong>Recargo nocturno</strong>
                <span>Habilita el cálculo de recargo nocturno.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="overtime_sunday_enabled"
                defaultChecked={config.modules.overtime.sundayEnabled}
              />
              <div>
                <strong>Dominicales</strong>
                <span>Permite liquidar trabajo dominical.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="overtime_festive_enabled"
                defaultChecked={config.modules.overtime.festiveEnabled}
              />
              <div>
                <strong>Festivos</strong>
                <span>Permite liquidar trabajo festivo.</span>
              </div>
            </label>
            <label>
              Tope diario de extras
              <input
                type="number"
                min="0"
                name="overtime_daily_cap_hours"
                defaultValue={config.modules.overtime.dailyCapHours}
              />
            </label>
            <label>
              Tope semanal de extras
              <input
                type="number"
                min="0"
                name="overtime_weekly_cap_hours"
                defaultValue={config.modules.overtime.weeklyCapHours}
              />
            </label>
            <label>
              Fuente principal
              <select name="overtime_source" defaultValue={config.modules.overtime.source}>
                <option value="attendance_and_manual">Asistencia + manual</option>
                <option value="manual_only">Solo manual</option>
                <option value="attendance_only">Solo asistencia</option>
              </select>
            </label>
            <div className="inline-actions">
              <SubmitButton label="Guardar extras y recargos" pendingLabel="Guardando..." />
            </div>
          </form>
        </Card>

        <Card
          title="Seguridad social y parafiscales"
          description="Controla aportes obligatorios y clase de riesgo por defecto."
        >
          <form className="form-grid" action={updatePayrollConfigurationSectionAction}>
            <input type="hidden" name="section_key" value="social_security" />
            <label className="toggle-card">
              <input
                type="checkbox"
                name="social_security_enabled"
                defaultChecked={config.modules.social_security.enabled}
              />
              <div>
                <strong>Seguridad social</strong>
                <span>Activa salud, pensión y ARL.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="social_security_health_enabled"
                defaultChecked={config.modules.social_security.healthEnabled}
              />
              <div>
                <strong>Salud</strong>
                <span>Calcula aporte de salud.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="social_security_pension_enabled"
                defaultChecked={config.modules.social_security.pensionEnabled}
              />
              <div>
                <strong>Pensión</strong>
                <span>Calcula aporte de pensión.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="social_security_solidarity_enabled"
                defaultChecked={config.modules.social_security.solidarityFundEnabled}
              />
              <div>
                <strong>Fondo de solidaridad</strong>
                <span>Activa validación sobre topes altos.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="parafiscals_enabled"
                defaultChecked={config.modules.social_security.parafiscalsEnabled}
              />
              <div>
                <strong>Parafiscales</strong>
                <span>Control general de caja, ICBF y SENA.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="parafiscals_compensation_enabled"
                defaultChecked={config.modules.social_security.compensationFundEnabled}
              />
              <div>
                <strong>Caja de compensación</strong>
                <span>Incluye el aporte para caja.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="parafiscals_icbf_enabled"
                defaultChecked={config.modules.social_security.icbfEnabled}
              />
              <div>
                <strong>ICBF</strong>
                <span>Incluye el aporte para ICBF.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="parafiscals_sena_enabled"
                defaultChecked={config.modules.social_security.senaEnabled}
              />
              <div>
                <strong>SENA</strong>
                <span>Incluye el aporte para SENA.</span>
              </div>
            </label>
            <label>
              Clase de riesgo ARL por defecto
              <select
                name="social_security_default_arl_risk_class"
                defaultValue={config.modules.social_security.defaultArlRiskClass}
              >
                <option value="1">Clase 1</option>
                <option value="2">Clase 2</option>
                <option value="3">Clase 3</option>
                <option value="4">Clase 4</option>
                <option value="5">Clase 5</option>
              </select>
            </label>
            <div className="inline-actions">
              <SubmitButton label="Guardar seguridad social" pendingLabel="Guardando..." />
            </div>
          </form>
        </Card>
      </SectionGrid>

      <SectionGrid>
        <Card
          title="Prestaciones, bonificaciones y comisiones"
          description="Determina qué conceptos prestacionales y pagos variables estarán disponibles."
        >
          <form className="form-grid" action={updatePayrollConfigurationSectionAction}>
            <input type="hidden" name="section_key" value="benefits" />
            <label className="toggle-card">
              <input type="checkbox" name="benefits_enabled" defaultChecked={config.modules.benefits.enabled} />
              <div>
                <strong>Prestaciones activas</strong>
                <span>Control general de prestaciones.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="benefits_severance_enabled"
                defaultChecked={config.modules.benefits.severanceEnabled}
              />
              <div>
                <strong>Cesantías</strong>
                <span>Activa cesantías dentro de la provisión.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="benefits_severance_interest_enabled"
                defaultChecked={config.modules.benefits.severanceInterestEnabled}
              />
              <div>
                <strong>Intereses de cesantías</strong>
                <span>Activa intereses sobre cesantías.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="benefits_service_bonus_enabled"
                defaultChecked={config.modules.benefits.serviceBonusEnabled}
              />
              <div>
                <strong>Prima de servicios</strong>
                <span>Activa prima en la empresa.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="benefits_vacation_accrual_enabled"
                defaultChecked={config.modules.benefits.vacationAccrualEnabled}
              />
              <div>
                <strong>Vacaciones causadas</strong>
                <span>Provisión automática de vacaciones.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="benefits_bonus_enabled"
                defaultChecked={config.modules.benefits.bonusEnabled}
              />
              <div>
                <strong>Bonificaciones</strong>
                <span>Permite bonos salariales o no salariales.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="benefits_commissions_enabled"
                defaultChecked={config.modules.benefits.commissionsEnabled}
              />
              <div>
                <strong>Comisiones</strong>
                <span>Activa ingresos por comisión.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="benefits_deductions_enabled"
                defaultChecked={config.modules.benefits.deductionsEnabled}
              />
              <div>
                <strong>Descuentos adicionales</strong>
                <span>Habilita descuentos manuales y deducciones internas.</span>
              </div>
            </label>
            <div className="inline-actions">
              <SubmitButton label="Guardar prestaciones y pagos variables" pendingLabel="Guardando..." />
            </div>
          </form>
        </Card>

        <Card
          title="Novedades, ausencias y asistencia"
          description="Ajusta incapacidades, faltas, vacaciones y control de tardanzas."
        >
          <form className="form-grid" action={updatePayrollConfigurationSectionAction}>
            <input type="hidden" name="section_key" value="novelties" />
            <label className="toggle-card">
              <input
                type="checkbox"
                name="novelties_incapacity_enabled"
                defaultChecked={config.modules.novelties.incapacityEnabled}
              />
              <div>
                <strong>Incapacidades</strong>
                <span>Activa el módulo de incapacidades.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="novelties_incapacity_supports_required"
                defaultChecked={config.modules.novelties.incapacitySupportsRequired}
              />
              <div>
                <strong>Soporte obligatorio</strong>
                <span>Exige soporte documental para incapacidades.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="novelties_vacations_enabled"
                defaultChecked={config.modules.novelties.vacationsEnabled}
              />
              <div>
                <strong>Vacaciones</strong>
                <span>Activa control de programación y disfrute.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="novelties_absences_enabled"
                defaultChecked={config.modules.novelties.absencesEnabled}
              />
              <div>
                <strong>Faltas y ausencias</strong>
                <span>Permite registrar faltas justificadas y no justificadas.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="novelties_unjustified_absence_discount"
                defaultChecked={config.modules.novelties.unjustifiedAbsenceDiscount}
              />
              <div>
                <strong>Descuento por falta no justificada</strong>
                <span>Aplica descuento cuando corresponda.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="novelties_attendance_adjustments_enabled"
                defaultChecked={config.modules.novelties.attendanceAdjustmentsEnabled}
              />
              <div>
                <strong>Ajustes de asistencia</strong>
                <span>Permite corregir ingresos y salidas.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="novelties_lateness_tracking_enabled"
                defaultChecked={config.modules.novelties.latenessTrackingEnabled}
              />
              <div>
                <strong>Control de tardanzas</strong>
                <span>Marca y acumula retrasos operativos.</span>
              </div>
            </label>
            <div className="inline-actions">
              <SubmitButton label="Guardar novedades y asistencia" pendingLabel="Guardando..." />
            </div>
          </form>
        </Card>
      </SectionGrid>

      <SectionGrid>
        <Card
          title="Auxilios y liquidación complementaria"
          description="Controla el auxilio de transporte, la forma de liquidar extras y la base de pagos variables."
        >
          <form className="form-grid" action={updatePayrollConfigurationSectionAction}>
            <input type="hidden" name="section_key" value="compensation" />
            <label className="toggle-card">
              <input
                type="checkbox"
                name="transport_allowance_enabled"
                defaultChecked={config.modules.compensation.transportAllowanceEnabled}
              />
              <div>
                <strong>Auxilio de transporte</strong>
                <span>Activa el cálculo del auxilio para la empresa.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="compensation_transport_allowance_prorated"
                defaultChecked={config.modules.compensation.transportAllowanceProrated}
              />
              <div>
                <strong>Prorrateo de auxilio</strong>
                <span>Ajusta el auxilio por ausencias o novedades.</span>
              </div>
            </label>
            <label>
              Regla de auxilio
              <select
                name="compensation_transport_allowance_mode"
                defaultValue={config.modules.compensation.transportAllowanceMode}
              >
                <option value="legal_threshold">Por tope legal</option>
                <option value="manual_by_employee">Manual por empleado</option>
                <option value="always_enabled">Siempre activo</option>
              </select>
            </label>
            <label>
              Tipo de bonificación por defecto
              <select
                name="compensation_bonus_default_type"
                defaultValue={config.modules.compensation.bonusDefaultType}
              >
                <option value="non_salary">No salarial</option>
                <option value="salary">Salarial</option>
                <option value="mixed">Mixta</option>
              </select>
            </label>
            <label>
              Liquidación de comisiones
              <select
                name="compensation_commission_settlement"
                defaultValue={config.modules.compensation.commissionSettlement}
              >
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
                <option value="manual">Manual</option>
              </select>
            </label>
            <label>
              Liquidación de extras
              <select
                name="compensation_overtime_payment_mode"
                defaultValue={config.modules.compensation.overtimePaymentMode}
              >
                <option value="payroll_period">Por período de nómina</option>
                <option value="daily_close">Cierre diario</option>
                <option value="manual_close">Cierre manual</option>
              </select>
            </label>
            <div className="inline-actions">
              <SubmitButton label="Guardar compensación" pendingLabel="Guardando..." />
            </div>
          </form>
        </Card>

        <Card
          title="Estructura organizacional"
          description="Ajusta cómo se comportan los catálogos y la personalización por empleado."
        >
          <form className="form-grid" action={updatePayrollConfigurationSectionAction}>
            <input type="hidden" name="section_key" value="organization" />
            <label className="toggle-card">
              <input
                type="checkbox"
                name="organization_seed_default_positions"
                defaultChecked={config.modules.organization.seedDefaultPositions}
              />
              <div>
                <strong>Cargos base</strong>
                <span>Mantiene el catálogo base de cargos.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="organization_seed_default_departments"
                defaultChecked={config.modules.organization.seedDefaultDepartments}
              />
              <div>
                <strong>Áreas base</strong>
                <span>Mantiene el catálogo base de áreas.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="organization_employee_overrides_enabled"
                defaultChecked={config.modules.organization.employeeOverridesEnabled}
              />
              <div>
                <strong>Overrides por empleado</strong>
                <span>Permite reglas particulares por persona.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="organization_custom_concepts_enabled"
                defaultChecked={config.modules.organization.customConceptsEnabled}
              />
              <div>
                <strong>Conceptos personalizados</strong>
                <span>Permite crear conceptos nuevos por empresa.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="organization_legal_parameters_editable"
                defaultChecked={config.modules.organization.legalParametersEditable}
              />
              <div>
                <strong>Parámetros legales editables</strong>
                <span>Permite sobrescribir valores legales a nivel empresa.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input
                type="checkbox"
                name="organization_multi_area_employees_enabled"
                defaultChecked={config.modules.organization.multiAreaEmployeesEnabled}
              />
              <div>
                <strong>Empleados multiárea</strong>
                <span>Permite una estructura más flexible por colaborador.</span>
              </div>
            </label>
            <div className="inline-actions">
              <SubmitButton label="Guardar estructura" pendingLabel="Guardando..." />
            </div>
          </form>
        </Card>
      </SectionGrid>
    </div>
  );
}
