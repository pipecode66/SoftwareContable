"use client";

import { useMemo, useState } from "react";
import { CUSTOM_SETUP_STEPS } from "@/src/server/payroll/templates/defaults";
import { SubmitButton } from "@/src/components/payroll/submit-button";

const stepDescriptions: Record<string, string> = {
  "jornada laboral": "Define la frecuencia principal, la jornada de referencia, los cortes y el flujo operativo base.",
  "horas extras y recargos": "Configura topes, autorización y el alcance del módulo de horas extras y recargos.",
  "seguridad social": "Activa salud, pensión, fondo de solidaridad y ARL por defecto para la empresa.",
  parafiscales: "Controla caja de compensación, ICBF y SENA según el modelo de la empresa.",
  prestaciones: "Habilita cesantías, intereses, prima y vacaciones causadas dentro de la liquidación.",
  bonificaciones: "Deja preparada la operación para bonos salariales o no salariales.",
  comisiones: "Configura el soporte de comisiones, descuentos asociados y forma de liquidación.",
  incapacidades: "Prepara el manejo de incapacidades y la exigencia de soportes dentro del sistema.",
  vacaciones: "Activa el control de vacaciones para programación, disfrute y causación.",
  faltas: "Configura faltas justificadas, no justificadas, tardanzas y ajustes de asistencia.",
  "auxilio transporte": "Controla la forma en que el sistema calcula y prorratea el auxilio de transporte.",
  "cargos y áreas": "Define cómo se inicializa la estructura organizacional y el nivel de personalización.",
  "revisión final": "Revisa el resumen completo antes de inicializar la cuenta de la empresa.",
};

type SetupFormState = Record<string, string | number | boolean>;

const INITIAL_STATE: SetupFormState = {
  payroll_frequency: "quincenal",
  weekly_max_hours: 46,
  daytime_start: "06:00",
  daytime_end: "21:00",
  night_start: "21:00",
  company_workday_type: "ordinaria",
  company_rest_day_policy: "individual",
  company_approval_flow: "company_admin",
  company_period_cutoff: "quincenal",
  overtime_enabled: true,
  overtime_requires_authorization: true,
  overtime_daily_cap_hours: 2,
  overtime_weekly_cap_hours: 12,
  overtime_night_surcharge_enabled: true,
  overtime_sunday_enabled: true,
  overtime_festive_enabled: true,
  overtime_source: "attendance_and_manual",
  social_security_enabled: true,
  social_security_health_enabled: true,
  social_security_pension_enabled: true,
  social_security_solidarity_enabled: true,
  social_security_default_arl_risk_class: 1,
  parafiscals_enabled: true,
  parafiscals_compensation_enabled: true,
  parafiscals_icbf_enabled: true,
  parafiscals_sena_enabled: true,
  benefits_enabled: true,
  benefits_severance_enabled: true,
  benefits_severance_interest_enabled: true,
  benefits_service_bonus_enabled: true,
  benefits_vacation_accrual_enabled: true,
  benefits_bonus_enabled: true,
  benefits_commissions_enabled: true,
  benefits_deductions_enabled: true,
  novelties_incapacity_enabled: true,
  novelties_incapacity_supports_required: true,
  novelties_vacations_enabled: true,
  novelties_absences_enabled: true,
  novelties_unjustified_absence_discount: true,
  novelties_attendance_adjustments_enabled: true,
  novelties_lateness_tracking_enabled: true,
  transport_allowance_enabled: true,
  compensation_transport_allowance_mode: "legal_threshold",
  compensation_transport_allowance_prorated: true,
  compensation_bonus_default_type: "non_salary",
  compensation_commission_settlement: "quincenal",
  compensation_overtime_payment_mode: "payroll_period",
  organization_seed_default_positions: true,
  organization_seed_default_departments: true,
  organization_employee_overrides_enabled: true,
  organization_custom_concepts_enabled: true,
  organization_legal_parameters_editable: true,
  organization_multi_area_employees_enabled: false,
};

function ToggleField({
  name,
  title,
  description,
  value,
  onChange,
}: {
  name: string;
  title: string;
  description: string;
  value: boolean;
  onChange: (name: string, value: boolean) => void;
}) {
  return (
    <label className="toggle-card">
      <input
        type="checkbox"
        checked={value}
        onChange={(event) => onChange(name, event.target.checked)}
      />
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
    </label>
  );
}

export function PayrollSetupWizard({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<SetupFormState>(INITIAL_STATE);
  const currentStep = CUSTOM_SETUP_STEPS[step];
  const progress = useMemo(
    () => Math.round(((step + 1) / CUSTOM_SETUP_STEPS.length) * 100),
    [step],
  );

  const setField = (name: string, value: string | number | boolean) => {
    setValues((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="form-grid">
            <label>
              Frecuencia de nómina
              <select
                name="payroll_frequency_visible"
                value={String(values.payroll_frequency)}
                onChange={(event) => setField("payroll_frequency", event.target.value)}
              >
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
                value={String(values.weekly_max_hours)}
                onChange={(event) => setField("weekly_max_hours", Number(event.target.value))}
              />
            </label>
            <label>
              Inicio jornada diurna
              <input
                type="time"
                value={String(values.daytime_start)}
                onChange={(event) => setField("daytime_start", event.target.value)}
              />
            </label>
            <label>
              Fin jornada diurna
              <input
                type="time"
                value={String(values.daytime_end)}
                onChange={(event) => setField("daytime_end", event.target.value)}
              />
            </label>
            <label>
              Inicio jornada nocturna
              <input
                type="time"
                value={String(values.night_start)}
                onChange={(event) => setField("night_start", event.target.value)}
              />
            </label>
            <label>
              Tipo de jornada base
              <select
                value={String(values.company_workday_type)}
                onChange={(event) => setField("company_workday_type", event.target.value)}
              >
                <option value="ordinaria">Ordinaria</option>
                <option value="mixta">Mixta</option>
                <option value="turnos">Turnos</option>
                <option value="parcial">Parcial</option>
              </select>
            </label>
            <label>
              Política de día de descanso
              <select
                value={String(values.company_rest_day_policy)}
                onChange={(event) => setField("company_rest_day_policy", event.target.value)}
              >
                <option value="individual">Por empleado</option>
                <option value="fixed_company">General por empresa</option>
                <option value="shift_based">Según turnos</option>
              </select>
            </label>
            <label>
              Flujo de aprobación
              <select
                value={String(values.company_approval_flow)}
                onChange={(event) => setField("company_approval_flow", event.target.value)}
              >
                <option value="company_admin">Administrador de empresa</option>
                <option value="payroll_analyst">Analista de nómina</option>
                <option value="supervisor_and_admin">Supervisor + administrador</option>
              </select>
            </label>
            <label>
              Corte operativo principal
              <select
                value={String(values.company_period_cutoff)}
                onChange={(event) => setField("company_period_cutoff", event.target.value)}
              >
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
                <option value="semanal">Semanal</option>
                <option value="diario">Diario</option>
              </select>
            </label>
          </div>
        );
      case 1:
        return (
          <div className="wizard-toggle-grid">
            <ToggleField
              name="overtime_enabled"
              title="Horas extras activas"
              description="Permite liquidar horas extras diurnas, nocturnas y dominicales."
              value={Boolean(values.overtime_enabled)}
              onChange={setField}
            />
            <ToggleField
              name="overtime_requires_authorization"
              title="Requiere autorización"
              description="Solicita validación previa para registrar o reconocer extras."
              value={Boolean(values.overtime_requires_authorization)}
              onChange={setField}
            />
            <ToggleField
              name="overtime_night_surcharge_enabled"
              title="Recargo nocturno"
              description="Mantiene el cálculo de recargo nocturno por horario."
              value={Boolean(values.overtime_night_surcharge_enabled)}
              onChange={setField}
            />
            <ToggleField
              name="overtime_sunday_enabled"
              title="Dominicales"
              description="Permite aplicar recargos y horas extras dominicales."
              value={Boolean(values.overtime_sunday_enabled)}
              onChange={setField}
            />
            <ToggleField
              name="overtime_festive_enabled"
              title="Festivos"
              description="Incluye recargos y extras en días festivos."
              value={Boolean(values.overtime_festive_enabled)}
              onChange={setField}
            />
            <label>
              Fuente principal del registro
              <select
                value={String(values.overtime_source)}
                onChange={(event) => setField("overtime_source", event.target.value)}
              >
                <option value="attendance_and_manual">Asistencia + manual</option>
                <option value="manual_only">Solo manual</option>
                <option value="attendance_only">Solo asistencia</option>
              </select>
            </label>
            <label>
              Tope diario de horas extra
              <input
                type="number"
                min="0"
                value={String(values.overtime_daily_cap_hours)}
                onChange={(event) => setField("overtime_daily_cap_hours", Number(event.target.value))}
              />
            </label>
            <label>
              Tope semanal de horas extra
              <input
                type="number"
                min="0"
                value={String(values.overtime_weekly_cap_hours)}
                onChange={(event) => setField("overtime_weekly_cap_hours", Number(event.target.value))}
              />
            </label>
          </div>
        );
      case 2:
        return (
          <div className="wizard-toggle-grid">
            <ToggleField
              name="social_security_enabled"
              title="Seguridad social activa"
              description="Habilita la capa de salud, pensión y ARL en la liquidación."
              value={Boolean(values.social_security_enabled)}
              onChange={setField}
            />
            <ToggleField
              name="social_security_health_enabled"
              title="Salud"
              description="Calcula el aporte de salud por empleado y empresa."
              value={Boolean(values.social_security_health_enabled)}
              onChange={setField}
            />
            <ToggleField
              name="social_security_pension_enabled"
              title="Pensión"
              description="Calcula el aporte de pensión por empleado y empresa."
              value={Boolean(values.social_security_pension_enabled)}
              onChange={setField}
            />
            <ToggleField
              name="social_security_solidarity_enabled"
              title="Fondo de solidaridad"
              description="Permite aplicar el fondo cuando el IBC supere el umbral."
              value={Boolean(values.social_security_solidarity_enabled)}
              onChange={setField}
            />
            <label>
              Clase de riesgo ARL por defecto
              <select
                value={String(values.social_security_default_arl_risk_class)}
                onChange={(event) => setField("social_security_default_arl_risk_class", Number(event.target.value))}
              >
                <option value="1">Clase 1</option>
                <option value="2">Clase 2</option>
                <option value="3">Clase 3</option>
                <option value="4">Clase 4</option>
                <option value="5">Clase 5</option>
              </select>
            </label>
          </div>
        );
      case 3:
        return (
          <div className="wizard-toggle-grid">
            <ToggleField
              name="parafiscals_enabled"
              title="Parafiscales activos"
              description="Activa caja, ICBF y SENA dentro de la cuenta."
              value={Boolean(values.parafiscals_enabled)}
              onChange={setField}
            />
            <ToggleField
              name="parafiscals_compensation_enabled"
              title="Caja de compensación"
              description="Incluye el aporte para caja de compensación."
              value={Boolean(values.parafiscals_compensation_enabled)}
              onChange={setField}
            />
            <ToggleField
              name="parafiscals_icbf_enabled"
              title="ICBF"
              description="Incluye el aporte para ICBF."
              value={Boolean(values.parafiscals_icbf_enabled)}
              onChange={setField}
            />
            <ToggleField
              name="parafiscals_sena_enabled"
              title="SENA"
              description="Incluye el aporte para SENA."
              value={Boolean(values.parafiscals_sena_enabled)}
              onChange={setField}
            />
          </div>
        );
      case 4:
        return (
          <div className="wizard-toggle-grid">
            <ToggleField
              name="benefits_enabled"
              title="Prestaciones activas"
              description="Mantiene las provisiones prestacionales dentro del motor de nómina."
              value={Boolean(values.benefits_enabled)}
              onChange={setField}
            />
            <ToggleField
              name="benefits_severance_enabled"
              title="Cesantías"
              description="Genera provisión de cesantías."
              value={Boolean(values.benefits_severance_enabled)}
              onChange={setField}
            />
            <ToggleField
              name="benefits_severance_interest_enabled"
              title="Intereses de cesantías"
              description="Calcula intereses sobre cesantías."
              value={Boolean(values.benefits_severance_interest_enabled)}
              onChange={setField}
            />
            <ToggleField
              name="benefits_service_bonus_enabled"
              title="Prima de servicios"
              description="Mantiene la provisión de prima en la cuenta."
              value={Boolean(values.benefits_service_bonus_enabled)}
              onChange={setField}
            />
            <ToggleField
              name="benefits_vacation_accrual_enabled"
              title="Vacaciones causadas"
              description="Calcula causación de vacaciones."
              value={Boolean(values.benefits_vacation_accrual_enabled)}
              onChange={setField}
            />
          </div>
        );
      case 5:
        return (
          <div className="wizard-toggle-grid">
            <ToggleField
              name="benefits_bonus_enabled"
              title="Bonificaciones activas"
              description="Permite manejar bonos dentro de la liquidación."
              value={Boolean(values.benefits_bonus_enabled)}
              onChange={setField}
            />
            <label>
              Tipo de bonificación por defecto
              <select
                value={String(values.compensation_bonus_default_type)}
                onChange={(event) => setField("compensation_bonus_default_type", event.target.value)}
              >
                <option value="non_salary">No salarial</option>
                <option value="salary">Salarial</option>
                <option value="mixed">Mixta</option>
              </select>
            </label>
          </div>
        );
      case 6:
        return (
          <div className="wizard-toggle-grid">
            <ToggleField
              name="benefits_commissions_enabled"
              title="Comisiones activas"
              description="Permite liquidar ingresos por comisión."
              value={Boolean(values.benefits_commissions_enabled)}
              onChange={setField}
            />
            <ToggleField
              name="benefits_deductions_enabled"
              title="Descuentos adicionales"
              description="Habilita descuentos manuales, préstamos y deducciones internas."
              value={Boolean(values.benefits_deductions_enabled)}
              onChange={setField}
            />
            <label>
              Frecuencia de liquidación de comisiones
              <select
                value={String(values.compensation_commission_settlement)}
                onChange={(event) => setField("compensation_commission_settlement", event.target.value)}
              >
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
                <option value="manual">Manual</option>
              </select>
            </label>
          </div>
        );
      case 7:
        return (
          <div className="wizard-toggle-grid">
            <ToggleField
              name="novelties_incapacity_enabled"
              title="Incapacidades activas"
              description="Habilita el módulo de incapacidades dentro de la cuenta."
              value={Boolean(values.novelties_incapacity_enabled)}
              onChange={setField}
            />
            <ToggleField
              name="novelties_incapacity_supports_required"
              title="Soporte obligatorio"
              description="Solicita soporte documental en incapacidades."
              value={Boolean(values.novelties_incapacity_supports_required)}
              onChange={setField}
            />
          </div>
        );
      case 8:
        return (
          <div className="wizard-toggle-grid">
            <ToggleField
              name="novelties_vacations_enabled"
              title="Vacaciones activas"
              description="Habilita programación y control de vacaciones."
              value={Boolean(values.novelties_vacations_enabled)}
              onChange={setField}
            />
            <ToggleField
              name="benefits_vacation_accrual_enabled"
              title="Causación de vacaciones"
              description="Mantiene la provisión automática de vacaciones causadas."
              value={Boolean(values.benefits_vacation_accrual_enabled)}
              onChange={setField}
            />
          </div>
        );
      case 9:
        return (
          <div className="wizard-toggle-grid">
            <ToggleField
              name="novelties_absences_enabled"
              title="Faltas y ausencias"
              description="Registra faltas justificadas y no justificadas."
              value={Boolean(values.novelties_absences_enabled)}
              onChange={setField}
            />
            <ToggleField
              name="novelties_unjustified_absence_discount"
              title="Descuento por falta no justificada"
              description="Aplica descuento automático cuando corresponda."
              value={Boolean(values.novelties_unjustified_absence_discount)}
              onChange={setField}
            />
            <ToggleField
              name="novelties_attendance_adjustments_enabled"
              title="Ajustes de asistencia"
              description="Permite registrar ingresos tardíos y correcciones."
              value={Boolean(values.novelties_attendance_adjustments_enabled)}
              onChange={setField}
            />
            <ToggleField
              name="novelties_lateness_tracking_enabled"
              title="Control de tardanzas"
              description="Marca atrasos cuando no hay ingreso a tiempo."
              value={Boolean(values.novelties_lateness_tracking_enabled)}
              onChange={setField}
            />
          </div>
        );
      case 10:
        return (
          <div className="wizard-toggle-grid">
            <ToggleField
              name="transport_allowance_enabled"
              title="Auxilio de transporte"
              description="Activa el cálculo del auxilio de transporte."
              value={Boolean(values.transport_allowance_enabled)}
              onChange={setField}
            />
            <ToggleField
              name="compensation_transport_allowance_prorated"
              title="Prorratear por ausencias"
              description="Permite ajustar el auxilio según faltas o novedades."
              value={Boolean(values.compensation_transport_allowance_prorated)}
              onChange={setField}
            />
            <label>
              Regla de aplicación del auxilio
              <select
                value={String(values.compensation_transport_allowance_mode)}
                onChange={(event) => setField("compensation_transport_allowance_mode", event.target.value)}
              >
                <option value="legal_threshold">Por tope legal</option>
                <option value="manual_by_employee">Manual por empleado</option>
                <option value="always_enabled">Siempre activo</option>
              </select>
            </label>
            <label>
              Momento de liquidación de extras
              <select
                value={String(values.compensation_overtime_payment_mode)}
                onChange={(event) => setField("compensation_overtime_payment_mode", event.target.value)}
              >
                <option value="payroll_period">Por período de nómina</option>
                <option value="daily_close">Cierre diario</option>
                <option value="manual_close">Cierre manual</option>
              </select>
            </label>
          </div>
        );
      case 11:
        return (
          <div className="wizard-toggle-grid">
            <ToggleField
              name="organization_seed_default_positions"
              title="Crear cargos base"
              description="Inicializa el catálogo base de cargos en la empresa."
              value={Boolean(values.organization_seed_default_positions)}
              onChange={setField}
            />
            <ToggleField
              name="organization_seed_default_departments"
              title="Crear áreas base"
              description="Inicializa el catálogo base de áreas o departamentos."
              value={Boolean(values.organization_seed_default_departments)}
              onChange={setField}
            />
            <ToggleField
              name="organization_employee_overrides_enabled"
              title="Overrides por empleado"
              description="Permite ajustar reglas específicas por empleado."
              value={Boolean(values.organization_employee_overrides_enabled)}
              onChange={setField}
            />
            <ToggleField
              name="organization_custom_concepts_enabled"
              title="Conceptos personalizados"
              description="Permite a la empresa crear conceptos adicionales."
              value={Boolean(values.organization_custom_concepts_enabled)}
              onChange={setField}
            />
            <ToggleField
              name="organization_legal_parameters_editable"
              title="Parámetros editables"
              description="Permite editar parámetros legales a nivel empresa."
              value={Boolean(values.organization_legal_parameters_editable)}
              onChange={setField}
            />
            <ToggleField
              name="organization_multi_area_employees_enabled"
              title="Empleados multiárea"
              description="Permite asignaciones más flexibles por área o estructura."
              value={Boolean(values.organization_multi_area_employees_enabled)}
              onChange={setField}
            />
          </div>
        );
      default:
        return (
          <div className="review-card">
            <h4>Resumen de inicialización</h4>
            <ul>
              <li>Frecuencia principal: {String(values.payroll_frequency)}.</li>
              <li>Horas extras activas: {Boolean(values.overtime_enabled) ? "Sí" : "No"}.</li>
              <li>Seguridad social activa: {Boolean(values.social_security_enabled) ? "Sí" : "No"}.</li>
              <li>Parafiscales activos: {Boolean(values.parafiscals_enabled) ? "Sí" : "No"}.</li>
              <li>Prestaciones activas: {Boolean(values.benefits_enabled) ? "Sí" : "No"}.</li>
              <li>Vacaciones activas: {Boolean(values.novelties_vacations_enabled) ? "Sí" : "No"}.</li>
              <li>Auxilio de transporte: {Boolean(values.transport_allowance_enabled) ? "Sí" : "No"}.</li>
              <li>Cargos base: {Boolean(values.organization_seed_default_positions) ? "Sí" : "No"}.</li>
            </ul>
          </div>
        );
    }
  };

  return (
    <div className="wizard-shell">
      <aside className="wizard-sidebar">
        <div>
          <span className="eyebrow">Configuración inicial</span>
          <h2>Wizard de nómina</h2>
          <p>Define la base operativa completa de la cuenta antes del primer uso.</p>
        </div>
        <div className="wizard-progress">
          <div className="wizard-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <ol className="wizard-steps">
          {CUSTOM_SETUP_STEPS.map((item, index) => (
            <li key={item} className={index === step ? "active" : index < step ? "done" : ""}>
              <button type="button" onClick={() => setStep(index)}>
                <strong>{String(index + 1).padStart(2, "0")}</strong>
                <span>{item}</span>
              </button>
            </li>
          ))}
        </ol>
      </aside>

      <form className="wizard-panel" action={action}>
        {Object.entries(values).map(([name, value]) => (
          <input
            key={name}
            type="hidden"
            name={name}
            value={typeof value === "boolean" ? String(value) : String(value)}
          />
        ))}

        <div className="wizard-step-head">
          <span className="eyebrow">Paso {step + 1}</span>
          <h3>{currentStep}</h3>
          <p>{stepDescriptions[currentStep]}</p>
        </div>

        {renderStepContent()}

        <div className="wizard-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0}
          >
            Anterior
          </button>
          {step < CUSTOM_SETUP_STEPS.length - 1 ? (
            <button
              type="button"
              className="primary-button"
              onClick={() => setStep((current) => Math.min(CUSTOM_SETUP_STEPS.length - 1, current + 1))}
            >
              Siguiente
            </button>
          ) : (
            <SubmitButton label="Inicializar empresa" pendingLabel="Inicializando..." />
          )}
        </div>
      </form>
    </div>
  );
}
