"use client";

import { useMemo, useState } from "react";
import { CUSTOM_SETUP_STEPS } from "@/src/server/payroll/templates/defaults";
import { SubmitButton } from "@/src/components/payroll/submit-button";

const stepDescriptions: Record<string, string> = {
  "jornada laboral": "Define la periodicidad principal, horas semanales y franjas diurna/nocturna.",
  "horas extras y recargos": "Activa o desactiva el cálculo automático de extras y recargos.",
  "seguridad social": "Controla si la empresa aplicará salud y pensión automáticamente.",
  parafiscales: "Permite dejar activos caja, ICBF y SENA por defecto.",
  prestaciones: "Habilita la provisión de cesantías, prima y vacaciones.",
  bonificaciones: "Deja lista la base para bonos salariales y no salariales.",
  comisiones: "Activa el soporte para comisiones y pagos variables.",
  incapacidades: "Prepara el flujo para incapacidades y porcentajes de pago.",
  vacaciones: "Deja disponible el módulo de vacaciones causadas y disfrutadas.",
  faltas: "Configura faltas justificadas y no justificadas desde el inicio.",
  "auxilio transporte": "Activa el manejo de auxilio de transporte en la cuenta.",
  "cargos y áreas": "La plantilla base se cargará para que luego puedas ampliarla.",
  "revisión final": "Confirma que la empresa quede inicializada y lista para operar.",
};

export function PayrollSetupWizard({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const currentStep = CUSTOM_SETUP_STEPS[step];
  const progress = useMemo(
    () => Math.round(((step + 1) / CUSTOM_SETUP_STEPS.length) * 100),
    [step],
  );

  return (
    <div className="wizard-shell">
      <aside className="wizard-sidebar">
        <div>
          <span className="eyebrow">Configuración inicial</span>
          <h2>Wizard de nómina</h2>
          <p>Personaliza la base sin perder compatibilidad con la plantilla general.</p>
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
        <div className="wizard-step-head">
          <span className="eyebrow">Paso {step + 1}</span>
          <h3>{currentStep}</h3>
          <p>{stepDescriptions[currentStep]}</p>
        </div>

        {step === 0 ? (
          <div className="form-grid">
            <label>
              Frecuencia de nómina
              <select name="payroll_frequency" defaultValue="quincenal">
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
                <option value="semanal">Semanal</option>
              </select>
            </label>
            <label>
              Horas máximas semanales
              <input type="number" name="weekly_max_hours" min="1" defaultValue="46" />
            </label>
            <label>
              Inicio jornada diurna
              <input type="time" name="daytime_start" defaultValue="06:00" />
            </label>
            <label>
              Fin jornada diurna
              <input type="time" name="daytime_end" defaultValue="21:00" />
            </label>
            <label>
              Inicio jornada nocturna
              <input type="time" name="night_start" defaultValue="21:00" />
            </label>
          </div>
        ) : null}

        {step > 0 && step < CUSTOM_SETUP_STEPS.length - 1 ? (
          <div className="wizard-toggle-grid">
            <label className="toggle-card">
              <input type="checkbox" name="overtime_enabled" defaultChecked />
              <div>
                <strong>Horas extras y recargos</strong>
                <span>Activa el cálculo automático heredado del módulo actual.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input type="checkbox" name="social_security_enabled" defaultChecked />
              <div>
                <strong>Seguridad social</strong>
                <span>Liquida salud y pensión desde la configuración inicial.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input type="checkbox" name="parafiscals_enabled" defaultChecked />
              <div>
                <strong>Parafiscales</strong>
                <span>Mantén caja, ICBF y SENA activos por defecto.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input type="checkbox" name="benefits_enabled" defaultChecked />
              <div>
                <strong>Prestaciones</strong>
                <span>Genera provisiones de cesantías, prima y vacaciones.</span>
              </div>
            </label>
            <label className="toggle-card">
              <input type="checkbox" name="transport_allowance_enabled" defaultChecked />
              <div>
                <strong>Auxilio de transporte</strong>
                <span>Incluye el concepto en la base de la empresa.</span>
              </div>
            </label>
          </div>
        ) : null}

        {step === CUSTOM_SETUP_STEPS.length - 1 ? (
          <div className="review-card">
            <h4>Resumen de inicialización</h4>
            <ul>
              <li>Se crearán conceptos base de nómina editables por empresa.</li>
              <li>Se cargarán parámetros legales vigentes para Colombia.</li>
              <li>Se dejarán listos cargos, áreas y configuraciones iniciales.</li>
              <li>La empresa quedará marcada como inicializada y lista para operar.</li>
            </ul>
          </div>
        ) : null}

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
