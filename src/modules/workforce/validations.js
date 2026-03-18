import {
  CONTRACT_TYPES,
  EMPLOYEE_TYPE_DEFINITIONS,
  NOVELTY_TYPES,
  PAYMENT_FREQUENCIES,
  PERIOD_TYPES,
  WEEK_DAYS,
} from "./data";
import { normalizeText } from "../../lib/overtime";

function ensure(condition, message, errors) {
  if (!condition) {
    errors.push(message);
  }
}

function timeToMinutes(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(String(value || ""));

  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

export function validatePhone(phone, allowBlank = false) {
  const clean = String(phone || "").trim();

  if (!clean) {
    return allowBlank;
  }

  return /^\d{10}$/.test(clean);
}

export function validateEmployeePayload(payload, employees, currentEmployeeId = null) {
  const errors = [];
  const employeeTypes = new Set(EMPLOYEE_TYPE_DEFINITIONS.map((item) => item.id));
  const contractTypes = new Set(CONTRACT_TYPES.map((item) => item.id));
  const paymentFrequencies = new Set(PAYMENT_FREQUENCIES.map((item) => item.id));
  const allowBlankPhone = normalizeText(payload.tipo_empleado) === "vacante";

  ensure(Boolean(String(payload.nombres || "").trim()), "Los nombres son obligatorios.", errors);
  ensure(Boolean(String(payload.apellidos || "").trim() || String(payload.nombre_completo || "").trim()), "Los apellidos o el nombre completo son obligatorios.", errors);
  ensure(Boolean(String(payload.cargo || "").trim()), "El cargo es obligatorio.", errors);
  ensure(validatePhone(payload.telefono, allowBlankPhone), "El teléfono debe tener 10 dígitos o quedar vacío solo en vacantes.", errors);
  ensure(employeeTypes.has(payload.tipo_empleado), "Selecciona un tipo de empleado válido.", errors);
  ensure(contractTypes.has(payload.tipo_contrato), "Selecciona un tipo de contrato válido.", errors);
  ensure(paymentFrequencies.has(payload.periodicidad_pago), "Selecciona una periodicidad de pago válida.", errors);
  ensure(WEEK_DAYS.includes(payload.dia_descanso), "El día de descanso debe ser válido.", errors);
  ensure(Number(payload.salario_base || 0) >= 0, "El salario base no puede ser negativo.", errors);
  ensure(Number(payload.bono_mensual || 0) >= 0, "El bono mensual no puede ser negativo.", errors);
  ensure(Number(payload.auxilio_transporte || 0) >= 0, "El auxilio de transporte no puede ser negativo.", errors);
  ensure(Number(payload.horas_semanales_contratadas || 0) >= 0, "Las horas semanales deben ser iguales o mayores a cero.", errors);

  const normalizedFullName = normalizeText(payload.nombre_completo || `${payload.nombres || ""} ${payload.apellidos || ""}`);
  const cleanPhone = String(payload.telefono || "").trim();
  const duplicate = employees.find((employee) => {
    if (employee.id === currentEmployeeId || employee.deleted_at) {
      return false;
    }

    const sameName = normalizeText(employee.nombre_completo) === normalizedFullName;
    const samePhone = cleanPhone && String(employee.telefono || "").trim() === cleanPhone;
    return sameName || samePhone;
  });

  ensure(!duplicate, "Ya existe un empleado con el mismo nombre o teléfono.", errors);

  return errors;
}

export function validateScheduleAssignment(payload, schedules, assignments, currentAssignmentId = null) {
  const errors = [];
  const template = schedules.find((schedule) => schedule.id === payload.template_id);

  ensure(Boolean(payload.employee_id), "Debes seleccionar un empleado.", errors);
  ensure(Boolean(template), "Debes seleccionar un horario válido.", errors);
  ensure(Boolean(payload.start_date), "La fecha inicial es obligatoria.", errors);
  ensure(Boolean(payload.end_date), "La fecha final es obligatoria.", errors);
  ensure(WEEK_DAYS.includes(payload.rest_day), "El día de descanso no es válido.", errors);
  ensure(
    !payload.start_date || !payload.end_date || payload.start_date <= payload.end_date,
    "La fecha inicial no puede ser mayor a la final.",
    errors,
  );

  if (template) {
    WEEK_DAYS.forEach((day) => {
      const blocks = template.blocks?.[day] || [];
      let lastEnd = -1;

      blocks.forEach((block) => {
        const start = timeToMinutes(block.start);
        const end = timeToMinutes(block.end);

        ensure(start !== null && end !== null && start < end, `El bloque ${day} ${block.start}-${block.end} no es válido.`, errors);

        if (start !== null && end !== null) {
          ensure(start >= lastEnd, `El horario ${template.name} tiene bloques solapados el ${day}.`, errors);
          lastEnd = end;
        }
      });

      if (day === payload.rest_day && blocks.length && !payload.override_rest_day) {
        errors.push("No puedes programar automáticamente el día de descanso sin activar la excepción manual.");
      }
    });
  }

  const overlap = assignments.find((assignment) => {
    if (assignment.id === currentAssignmentId || !assignment.is_active) {
      return false;
    }

    if (assignment.employee_id !== payload.employee_id) {
      return false;
    }

    return !(payload.end_date < assignment.start_date || payload.start_date > assignment.end_date);
  });

  ensure(!overlap, "El empleado ya tiene una asignación activa en un rango que se cruza.", errors);

  return errors;
}

export function validateAttendanceLog(payload, employee) {
  const errors = [];
  const noveltyTypes = new Set(NOVELTY_TYPES.map((item) => item.id));

  ensure(Boolean(employee), "Debes seleccionar un empleado válido.", errors);
  ensure(Boolean(payload.date), "La fecha es obligatoria.", errors);
  ensure(noveltyTypes.has(payload.novelty_type), "Selecciona una novedad válida.", errors);

  [
    "ordinary_hours",
    "extra_day_hours",
    "extra_night_hours",
    "night_surcharge_hours",
    "sunday_hours",
    "festive_hours",
    "sunday_night_hours",
  ].forEach((field) => {
    ensure(Number(payload[field] || 0) >= 0, `El campo ${field} no puede ser negativo.`, errors);
  });

  return errors;
}

export function validatePayrollPeriod(payload, periods, calculations, currentPeriodId = null, allowReprocess = false) {
  const errors = [];
  const periodTypes = new Set(PERIOD_TYPES.map((item) => item.id));

  ensure(Boolean(String(payload.label || "").trim()), "La etiqueta del período es obligatoria.", errors);
  ensure(periodTypes.has(payload.period_type), "Selecciona un tipo de período válido.", errors);
  ensure(Boolean(payload.start_date), "La fecha inicial es obligatoria.", errors);
  ensure(Boolean(payload.end_date), "La fecha final es obligatoria.", errors);
  ensure(
    !payload.start_date || !payload.end_date || payload.start_date <= payload.end_date,
    "La fecha inicial no puede ser mayor a la final.",
    errors,
  );

  const overlap = periods.find((period) => {
    if (period.id === currentPeriodId || period.deleted_at) {
      return false;
    }

    return !(payload.end_date < period.start_date || payload.start_date > period.end_date);
  });

  ensure(!overlap, "Ya existe un período que se cruza con ese rango.", errors);

  const alreadyCalculated = calculations.some((calculation) => calculation.period_id === currentPeriodId);

  if (alreadyCalculated && !allowReprocess) {
    errors.push("Ese período ya fue liquidado. Activa la autorización de reproceso para volver a calcular.");
  }

  return errors;
}
