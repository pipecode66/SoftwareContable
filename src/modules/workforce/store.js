import {
  CURRENT_DATE,
  CURRENT_TIMESTAMP,
  EMPLOYEE_TYPE_DEFINITIONS,
  ROLE_DEFINITIONS,
  SCHEDULE_TEMPLATES,
  WORKFORCE_SCHEMA_VERSION,
  WORKFORCE_STORAGE_KEY,
  createSeedDatabase,
} from "./data";
import { buildPaySlip, calculateEmployeePayroll } from "./payrollEngine";
import {
  validateAttendanceLog,
  validateEmployeePayload,
  validatePayrollPeriod,
  validateScheduleAssignment,
} from "./validations";
import {
  buildPayslipMessage,
  buildScheduleMessage,
  createWhatsAppService,
} from "./whatsappService";
import { normalizeText } from "../../lib/overtime";

const LEGACY_STORAGE_KEYS = ["kaiko.workforce.v1"];

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function createRuntimeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true" || value === "1" || value === 1) {
    return true;
  }

  if (value === "false" || value === "0" || value === 0) {
    return false;
  }

  return fallback;
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value ?? fallback);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function getTypeDefinition(typeId) {
  return EMPLOYEE_TYPE_DEFINITIONS.find((item) => item.id === typeId) || EMPLOYEE_TYPE_DEFINITIONS[2];
}

function getDefaultTemplateId(employee) {
  if (employee.tipo_empleado === "turnero_30h") {
    return "turnero_30h";
  }

  if (employee.tipo_empleado === "management_confidence") {
    return "administrativo";
  }

  return "general_regular";
}

function normalizeWeekDay(value) {
  return normalizeText(value || "domingo").replace(/\s+/g, "_");
}

function buildFullName(payload) {
  const fullName = String(payload.nombre_completo || "").trim();

  if (fullName) {
    return fullName;
  }

  return `${String(payload.nombres || "").trim()} ${String(payload.apellidos || "").trim()}`.trim();
}

function stamp(base, currentTimestamp = nowIso()) {
  return {
    created_at: currentTimestamp,
    updated_at: currentTimestamp,
    deleted_at: null,
    ...base,
  };
}

function normalizeEmployee(rawEmployee) {
  const employee = rawEmployee || {};
  const typeId = employee.tipo_empleado || "regular";
  const typeDefaults = getTypeDefinition(typeId).defaults;
  const fullName = buildFullName({
    nombre_completo: employee.nombre_completo,
    nombres: employee.nombres,
    apellidos: employee.apellidos,
  });
  const nameParts = fullName.split(/\s+/).filter(Boolean);

  return {
    ...typeDefaults,
    id: employee.id || createRuntimeId("emp"),
    nombres: String(employee.nombres || nameParts.slice(0, -1).join(" ") || nameParts[0] || "").trim(),
    apellidos: String(employee.apellidos || (nameParts.length > 1 ? nameParts.at(-1) : "")).trim(),
    nombre_completo: fullName,
    cargo: String(employee.cargo || "").trim(),
    telefono: String(employee.telefono || employee["teléfono"] || "").trim(),
    tipo_empleado: typeId,
    estado: employee.estado || typeDefaults.estado || "activo",
    fecha_ingreso: employee.fecha_ingreso || CURRENT_DATE,
    observaciones: String(employee.observaciones || "").trim(),
    tipo_contrato: employee.tipo_contrato || typeDefaults.tipo_contrato || "termino_indefinido",
    salario_base: toNumber(employee.salario_base),
    periodicidad_pago: employee.periodicidad_pago || typeDefaults.periodicidad_pago || "mensual",
    bono_mensual: toNumber(employee.bono_mensual),
    auxilio_transporte: toNumber(employee.auxilio_transporte),
    horas_semanales_contratadas: toNumber(
      employee.horas_semanales_contratadas,
      typeDefaults.horas_semanales_contratadas || 46,
    ),
    aplica_horas_extras: toBoolean(
      employee.aplica_horas_extras,
      typeDefaults.aplica_horas_extras,
    ),
    aplica_recargo_nocturno: toBoolean(
      employee.aplica_recargo_nocturno,
      typeDefaults.aplica_recargo_nocturno,
    ),
    aplica_recargo_dominical: toBoolean(
      employee.aplica_recargo_dominical,
      typeDefaults.aplica_recargo_dominical,
    ),
    aplica_recargo_festivo: toBoolean(
      employee.aplica_recargo_festivo,
      typeDefaults.aplica_recargo_festivo,
    ),
    aplica_recargo_nocturno_dominical: toBoolean(
      employee.aplica_recargo_nocturno_dominical,
      typeDefaults.aplica_recargo_nocturno_dominical,
    ),
    es_cargo_manejo_confianza: toBoolean(
      employee.es_cargo_manejo_confianza,
      typeDefaults.es_cargo_manejo_confianza,
    ),
    dia_descanso: normalizeWeekDay(employee.dia_descanso || employee["día_descanso"] || "domingo"),
    notas_liquidacion: String(employee.notas_liquidacion || employee["notas_liquidación"] || "").trim(),
    descuentos_fijos: toNumber(employee.descuentos_fijos),
    created_at: employee.created_at || CURRENT_TIMESTAMP,
    updated_at: employee.updated_at || CURRENT_TIMESTAMP,
    deleted_at: employee.deleted_at || null,
  };
}

function normalizeScheduleAssignment(rawAssignment) {
  const assignment = rawAssignment || {};

  return {
    id: assignment.id || createRuntimeId("asg"),
    employee_id: assignment.employee_id || "",
    template_id: assignment.template_id || "general_regular",
    start_date: assignment.start_date || CURRENT_DATE,
    end_date: assignment.end_date || CURRENT_DATE,
    rest_day: normalizeWeekDay(assignment.rest_day || "domingo"),
    override_rest_day: toBoolean(assignment.override_rest_day),
    is_active: assignment.is_active !== false,
    notes: String(assignment.notes || "").trim(),
    created_at: assignment.created_at || CURRENT_TIMESTAMP,
    updated_at: assignment.updated_at || CURRENT_TIMESTAMP,
    deleted_at: assignment.deleted_at || null,
  };
}

function normalizeAttendanceEntry(rawEntry) {
  const entry = rawEntry || {};

  return {
    id: entry.id || createRuntimeId("att"),
    employee_id: entry.employee_id || "",
    date: entry.date || CURRENT_DATE,
    ordinary_hours: toNumber(entry.ordinary_hours),
    extra_day_hours: toNumber(entry.extra_day_hours),
    extra_night_hours: toNumber(entry.extra_night_hours),
    night_surcharge_hours: toNumber(entry.night_surcharge_hours),
    sunday_hours: toNumber(entry.sunday_hours),
    festive_hours: toNumber(entry.festive_hours),
    sunday_night_hours: toNumber(entry.sunday_night_hours),
    novelty_type: entry.novelty_type || "normal",
    notes: String(entry.notes || "").trim(),
    source: entry.source || "manual",
    created_at: entry.created_at || CURRENT_TIMESTAMP,
    updated_at: entry.updated_at || CURRENT_TIMESTAMP,
    deleted_at: entry.deleted_at || null,
  };
}

function normalizePeriod(rawPeriod) {
  const period = rawPeriod || {};

  return {
    id: period.id || createRuntimeId("period"),
    label: String(period.label || "").trim(),
    period_type: period.period_type || "quincenal",
    start_date: period.start_date || CURRENT_DATE,
    end_date: period.end_date || CURRENT_DATE,
    status: period.status || "abierto",
    created_at: period.created_at || CURRENT_TIMESTAMP,
    updated_at: period.updated_at || CURRENT_TIMESTAMP,
    deleted_at: period.deleted_at || null,
  };
}

function ensureCollections(database) {
  const seed = createSeedDatabase();

  return {
    meta: database.meta || seed.meta,
    employee_types: toArray(database.employee_types).length ? database.employee_types : seed.employee_types,
    roles: toArray(database.roles).length ? database.roles : ROLE_DEFINITIONS,
    users: toArray(database.users).length ? database.users : seed.users,
    employees: toArray(database.employees).map(normalizeEmployee),
    employee_contract_rules: toArray(database.employee_contract_rules),
    employee_payment_config: toArray(database.employee_payment_config),
    schedules: toArray(database.schedules).length ? database.schedules : SCHEDULE_TEMPLATES,
    schedule_assignments: toArray(database.schedule_assignments).map(normalizeScheduleAssignment),
    attendance_logs: toArray(database.attendance_logs).map(normalizeAttendanceEntry),
    payroll_periods: toArray(database.payroll_periods).map(normalizePeriod),
    payroll_calculations: toArray(database.payroll_calculations),
    payroll_calculation_details: toArray(database.payroll_calculation_details),
    bonuses: toArray(database.bonuses),
    transport_allowances: toArray(database.transport_allowances),
    notifications: toArray(database.notifications),
    exports_history: toArray(database.exports_history),
    audit_logs: toArray(database.audit_logs),
  };
}

function syncEmployeeDerivedCollections(database, employee, currentTimestamp) {
  const currentRule = database.employee_contract_rules.find((item) => item.employee_id === employee.id);
  const currentPayment = database.employee_payment_config.find((item) => item.employee_id === employee.id);

  const contractRule = {
    id: currentRule?.id || createRuntimeId("rule"),
    employee_id: employee.id,
    tipo_contrato: employee.tipo_contrato,
    aplica_horas_extras: employee.aplica_horas_extras,
    aplica_recargo_nocturno: employee.aplica_recargo_nocturno,
    aplica_recargo_dominical: employee.aplica_recargo_dominical,
    aplica_recargo_festivo: employee.aplica_recargo_festivo,
    aplica_recargo_nocturno_dominical: employee.aplica_recargo_nocturno_dominical,
    es_cargo_manejo_confianza: employee.es_cargo_manejo_confianza,
    created_at: currentRule?.created_at || currentTimestamp,
    updated_at: currentTimestamp,
  };

  const paymentConfig = {
    id: currentPayment?.id || createRuntimeId("pay"),
    employee_id: employee.id,
    periodicidad_pago: employee.periodicidad_pago,
    salario_base: employee.salario_base,
    bono_mensual: employee.bono_mensual,
    auxilio_transporte: employee.auxilio_transporte,
    horas_semanales_contratadas: employee.horas_semanales_contratadas,
    created_at: currentPayment?.created_at || currentTimestamp,
    updated_at: currentTimestamp,
  };

  database.employee_contract_rules = database.employee_contract_rules.filter(
    (item) => item.employee_id !== employee.id,
  );
  database.employee_payment_config = database.employee_payment_config.filter(
    (item) => item.employee_id !== employee.id,
  );
  database.employee_contract_rules.push(contractRule);
  database.employee_payment_config.push(paymentConfig);
}

function recordAudit(database, currentUser, action, entityType, entityId, previousValue, nextValue) {
  database.audit_logs.unshift(
    stamp({
      id: createRuntimeId("audit"),
      entity_type: entityType,
      entity_id: entityId,
      action,
      executed_by: currentUser?.email || "system",
      previous_value: previousValue ?? null,
      next_value: nextValue ?? null,
      executed_at: nowIso(),
    }),
  );
}

function touchMeta(database) {
  database.meta = {
    ...database.meta,
    version: WORKFORCE_SCHEMA_VERSION,
    updated_at: nowIso(),
  };
}

function migrateDatabase(rawDatabase) {
  if (!rawDatabase || typeof rawDatabase !== "object") {
    return createSeedDatabase();
  }

  const database = ensureCollections(rawDatabase);
  const nextDatabase = deepClone(database);
  nextDatabase.meta = {
    ...(nextDatabase.meta || {}),
    version: WORKFORCE_SCHEMA_VERSION,
    created_at: nextDatabase.meta?.created_at || CURRENT_TIMESTAMP,
    updated_at: nowIso(),
  };

  nextDatabase.employees.forEach((employee) => {
    syncEmployeeDerivedCollections(nextDatabase, employee, nowIso());

    if (
      !nextDatabase.schedule_assignments.some(
        (assignment) => assignment.employee_id === employee.id && assignment.is_active,
      )
    ) {
      nextDatabase.schedule_assignments.push(
        normalizeScheduleAssignment({
          employee_id: employee.id,
          template_id: getDefaultTemplateId(employee),
          start_date: CURRENT_DATE,
          end_date: CURRENT_DATE,
          rest_day: employee.dia_descanso,
          notes: "Asignación recuperada durante migración.",
        }),
      );
    }
  });

  return nextDatabase;
}

function readStorage(key) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loadWorkforceDatabase() {
  const current = readStorage(WORKFORCE_STORAGE_KEY);

  if (current) {
    return migrateDatabase(current);
  }

  for (const legacyKey of LEGACY_STORAGE_KEYS) {
    const legacyValue = readStorage(legacyKey);

    if (legacyValue) {
      const migrated = migrateDatabase(legacyValue);
      persistWorkforceDatabase(migrated);
      return migrated;
    }
  }

  const seed = createSeedDatabase();
  persistWorkforceDatabase(seed);
  return seed;
}

export function persistWorkforceDatabase(database) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(WORKFORCE_STORAGE_KEY, JSON.stringify(database));
}

export function resetWorkforceDatabase() {
  const seed = createSeedDatabase();
  persistWorkforceDatabase(seed);
  return seed;
}

export function getCurrentUserContext(database, email) {
  const user =
    database.users.find((item) => item.email === email) ||
    database.users.find((item) => item.email === "admin@sandeli.com") ||
    null;
  const role = database.roles.find((item) => item.id === user?.role_id) || ROLE_DEFINITIONS[0];

  return {
    user,
    role,
    permissions: role.permissions || [],
  };
}

export function listEmployees(database, filters = {}) {
  return database.employees
    .filter((employee) => !employee.deleted_at)
    .filter((employee) => {
      if (filters.status && employee.estado !== filters.status) {
        return false;
      }

      if (filters.tipo_empleado && employee.tipo_empleado !== filters.tipo_empleado) {
        return false;
      }

      if (filters.cargo && normalizeText(employee.cargo) !== normalizeText(filters.cargo)) {
        return false;
      }

      if (filters.search) {
        const searchValue = normalizeText(filters.search);
        const haystack = [
          employee.nombre_completo,
          employee.nombres,
          employee.apellidos,
          employee.cargo,
          employee.telefono,
        ]
          .map((item) => normalizeText(item))
          .join(" ");

        if (!haystack.includes(searchValue)) {
          return false;
        }
      }

      return true;
    })
    .sort((left, right) => left.nombre_completo.localeCompare(right.nombre_completo, "es"));
}

export function getEmployeeById(database, employeeId) {
  return database.employees.find((employee) => employee.id === employeeId && !employee.deleted_at) || null;
}

export function getEmployeeScheduleAssignment(database, employeeId) {
  return (
    database.schedule_assignments.find(
      (assignment) => assignment.employee_id === employeeId && assignment.is_active && !assignment.deleted_at,
    ) || null
  );
}

export function getScheduleTemplate(database, templateId) {
  return database.schedules.find((schedule) => schedule.id === templateId) || null;
}

export function listAttendanceLogs(database, filters = {}) {
  return database.attendance_logs
    .filter((entry) => !entry.deleted_at)
    .filter((entry) => {
      if (filters.employee_id && entry.employee_id !== filters.employee_id) {
        return false;
      }

      if (filters.start_date && entry.date < filters.start_date) {
        return false;
      }

      if (filters.end_date && entry.date > filters.end_date) {
        return false;
      }

      return true;
    })
    .sort((left, right) => right.date.localeCompare(left.date));
}

export function listPayrollPeriods(database) {
  return database.payroll_periods
    .filter((period) => !period.deleted_at)
    .sort((left, right) => right.end_date.localeCompare(left.end_date));
}

export function getPayrollPeriod(database, periodId) {
  return database.payroll_periods.find((period) => period.id === periodId && !period.deleted_at) || null;
}

export function upsertEmployee(database, payload, currentUserEmail) {
  const draft = deepClone(database);
  const { user } = getCurrentUserContext(draft, currentUserEmail);
  const currentTimestamp = nowIso();
  const existing = payload.id ? draft.employees.find((employee) => employee.id === payload.id) : null;
  const typeDefaults = getTypeDefinition(payload.tipo_empleado || existing?.tipo_empleado || "regular").defaults;
  const nextEmployee = normalizeEmployee({
    ...typeDefaults,
    ...existing,
    ...payload,
    id: existing?.id || createRuntimeId("emp"),
    updated_at: currentTimestamp,
    created_at: existing?.created_at || currentTimestamp,
  });
  const errors = validateEmployeePayload(nextEmployee, draft.employees, existing?.id || null);

  if (errors.length) {
    throw new Error(errors.join(" "));
  }

  draft.employees = draft.employees.filter((employee) => employee.id !== nextEmployee.id);
  draft.employees.push(nextEmployee);
  syncEmployeeDerivedCollections(draft, nextEmployee, currentTimestamp);

  if (!existing) {
    draft.schedule_assignments.push(
      normalizeScheduleAssignment({
        employee_id: nextEmployee.id,
        template_id: getDefaultTemplateId(nextEmployee),
        start_date: CURRENT_DATE,
        end_date: CURRENT_DATE,
        rest_day: nextEmployee.dia_descanso,
        notes: "Asignación inicial automática.",
      }),
    );
  }

  recordAudit(
    draft,
    user,
    existing ? "editar_empleado" : "crear_empleado",
    "employees",
    nextEmployee.id,
    existing || null,
    nextEmployee,
  );
  touchMeta(draft);
  return draft;
}

export function softDeleteEmployee(database, employeeId, currentUserEmail) {
  const draft = deepClone(database);
  const { user } = getCurrentUserContext(draft, currentUserEmail);
  const currentTimestamp = nowIso();
  const employee = draft.employees.find((item) => item.id === employeeId && !item.deleted_at);

  if (!employee) {
    throw new Error("No se encontró el empleado a eliminar.");
  }

  const previous = deepClone(employee);
  employee.estado = "inactivo";
  employee.deleted_at = currentTimestamp;
  employee.updated_at = currentTimestamp;
  draft.schedule_assignments = draft.schedule_assignments.map((assignment) =>
    assignment.employee_id === employeeId
      ? {
          ...assignment,
          is_active: false,
          updated_at: currentTimestamp,
          deleted_at: assignment.deleted_at || currentTimestamp,
        }
      : assignment,
  );

  recordAudit(draft, user, "eliminar_empleado", "employees", employeeId, previous, employee);
  touchMeta(draft);
  return draft;
}

export function upsertScheduleAssignment(database, payload, currentUserEmail) {
  const draft = deepClone(database);
  const { user } = getCurrentUserContext(draft, currentUserEmail);
  const currentTimestamp = nowIso();
  const existing = payload.id
    ? draft.schedule_assignments.find((assignment) => assignment.id === payload.id)
    : null;
  const nextAssignment = normalizeScheduleAssignment({
    ...existing,
    ...payload,
    id: existing?.id || createRuntimeId("asg"),
    updated_at: currentTimestamp,
    created_at: existing?.created_at || currentTimestamp,
  });
  const errors = validateScheduleAssignment(
    nextAssignment,
    draft.schedules,
    draft.schedule_assignments,
    existing?.id || null,
  );

  if (errors.length) {
    throw new Error(errors.join(" "));
  }

  if (!existing) {
    draft.schedule_assignments = draft.schedule_assignments.map((assignment) =>
      assignment.employee_id === nextAssignment.employee_id && assignment.is_active
        ? { ...assignment, is_active: false, updated_at: currentTimestamp }
        : assignment,
    );
  }

  draft.schedule_assignments = draft.schedule_assignments.filter(
    (assignment) => assignment.id !== nextAssignment.id,
  );
  draft.schedule_assignments.push(nextAssignment);

  recordAudit(
    draft,
    user,
    existing ? "editar_horario" : "crear_horario",
    "schedule_assignments",
    nextAssignment.id,
    existing || null,
    nextAssignment,
  );
  touchMeta(draft);
  return draft;
}

export function softDeleteScheduleAssignment(database, assignmentId, currentUserEmail) {
  const draft = deepClone(database);
  const { user } = getCurrentUserContext(draft, currentUserEmail);
  const currentTimestamp = nowIso();
  const assignment = draft.schedule_assignments.find(
    (item) => item.id === assignmentId && !item.deleted_at,
  );

  if (!assignment) {
    throw new Error("No se encontró la asignación a eliminar.");
  }

  const previous = deepClone(assignment);
  assignment.is_active = false;
  assignment.deleted_at = currentTimestamp;
  assignment.updated_at = currentTimestamp;
  recordAudit(
    draft,
    user,
    "eliminar_horario",
    "schedule_assignments",
    assignmentId,
    previous,
    assignment,
  );
  touchMeta(draft);
  return draft;
}

export function upsertAttendanceLog(database, payload, currentUserEmail) {
  const draft = deepClone(database);
  const { user } = getCurrentUserContext(draft, currentUserEmail);
  const currentTimestamp = nowIso();
  const existing = payload.id ? draft.attendance_logs.find((entry) => entry.id === payload.id) : null;
  const nextLog = normalizeAttendanceEntry({
    ...existing,
    ...payload,
    id: existing?.id || createRuntimeId("att"),
    updated_at: currentTimestamp,
    created_at: existing?.created_at || currentTimestamp,
  });
  const employee = getEmployeeById(draft, nextLog.employee_id);
  const errors = validateAttendanceLog(nextLog, employee);

  if (errors.length) {
    throw new Error(errors.join(" "));
  }

  draft.attendance_logs = draft.attendance_logs.filter((entry) => entry.id !== nextLog.id);
  draft.attendance_logs.push(nextLog);

  recordAudit(
    draft,
    user,
    existing ? "editar_novedad" : "crear_novedad",
    "attendance_logs",
    nextLog.id,
    existing || null,
    nextLog,
  );
  touchMeta(draft);
  return draft;
}

export function softDeleteAttendanceLog(database, logId, currentUserEmail) {
  const draft = deepClone(database);
  const { user } = getCurrentUserContext(draft, currentUserEmail);
  const currentTimestamp = nowIso();
  const entry = draft.attendance_logs.find((item) => item.id === logId && !item.deleted_at);

  if (!entry) {
    throw new Error("No se encontró la novedad a eliminar.");
  }

  const previous = deepClone(entry);
  entry.deleted_at = currentTimestamp;
  entry.updated_at = currentTimestamp;
  recordAudit(draft, user, "eliminar_novedad", "attendance_logs", logId, previous, entry);
  touchMeta(draft);
  return draft;
}

export function upsertPayrollPeriod(database, payload, currentUserEmail, options = {}) {
  const draft = deepClone(database);
  const { user } = getCurrentUserContext(draft, currentUserEmail);
  const currentTimestamp = nowIso();
  const existing = payload.id ? draft.payroll_periods.find((period) => period.id === payload.id) : null;
  const nextPeriod = normalizePeriod({
    ...existing,
    ...payload,
    id: existing?.id || createRuntimeId("period"),
    updated_at: currentTimestamp,
    created_at: existing?.created_at || currentTimestamp,
  });
  const errors = validatePayrollPeriod(
    nextPeriod,
    draft.payroll_periods,
    draft.payroll_calculations,
    existing?.id || null,
    options.allowReprocess,
  );

  if (errors.length) {
    throw new Error(errors.join(" "));
  }

  draft.payroll_periods = draft.payroll_periods.filter((period) => period.id !== nextPeriod.id);
  draft.payroll_periods.push(nextPeriod);

  recordAudit(
    draft,
    user,
    existing ? "editar_periodo" : "crear_periodo",
    "payroll_periods",
    nextPeriod.id,
    existing || null,
    nextPeriod,
  );
  touchMeta(draft);
  return draft;
}

function getPeriodLogs(database, periodId) {
  const period = getPayrollPeriod(database, periodId);

  if (!period) {
    throw new Error("No se encontró el período seleccionado.");
  }

  return listAttendanceLogs(database, {
    start_date: period.start_date,
    end_date: period.end_date,
  });
}

export function calculateAndStorePayroll(database, periodId, currentUserEmail, options = {}) {
  const draft = deepClone(database);
  const { user } = getCurrentUserContext(draft, currentUserEmail);
  const currentTimestamp = nowIso();
  const period = getPayrollPeriod(draft, periodId);

  if (!period) {
    throw new Error("No se encontró el período seleccionado.");
  }

  const existingCalculations = draft.payroll_calculations.filter(
    (calculation) => calculation.period_id === periodId,
  );

  if (existingCalculations.length && !options.allowReprocess) {
    throw new Error("La quincena ya fue liquidada. Activa el reproceso si necesitas recalcular.");
  }

  if (existingCalculations.length && options.allowReprocess) {
    const calculationIds = existingCalculations.map((item) => item.id);
    draft.payroll_calculations = draft.payroll_calculations.filter((item) => item.period_id !== periodId);
    draft.payroll_calculation_details = draft.payroll_calculation_details.filter(
      (detail) => !calculationIds.includes(detail.calculation_id),
    );
  }

  const employees = listEmployees(draft, { status: "activo" });
  const periodLogs = getPeriodLogs(draft, periodId);

  const nextCalculations = employees.map((employee) => {
    const employeeLogs = periodLogs.filter((entry) => entry.employee_id === employee.id);
    const calculation = calculateEmployeePayroll(employee, employeeLogs, period);
    const calculationId = createRuntimeId("calc");

    draft.payroll_calculation_details.push(
      ...calculation.details.map((detail) =>
        stamp(
          {
            id: createRuntimeId("detail"),
            calculation_id: calculationId,
            period_id: period.id,
            employee_id: employee.id,
            code: detail.code,
            label: detail.label,
            quantity: detail.quantity,
            multiplier: detail.multiplier,
            total: detail.total,
          },
          currentTimestamp,
        ),
      ),
    );

    return stamp(
      {
        id: calculationId,
        employee_id: employee.id,
        period_id: period.id,
        hourly_rate: calculation.hourly_rate,
        base_salary_period: calculation.base_salary_period,
        bonuses_value: calculation.bonuses_value,
        transport_value: calculation.transport_value,
        discounts_value: calculation.discounts_value,
        overtime_value: calculation.overtime_value,
        surcharge_value: calculation.surcharge_value,
        total_pay: calculation.total_pay,
        ordinary_hours: calculation.summary.ordinary_hours,
        extra_hours: calculation.summary.extra_hours,
        surcharge_hours: calculation.summary.surcharge_hours,
        traces: calculation.traces,
        calculated_at: currentTimestamp,
      },
      currentTimestamp,
    );
  });

  draft.payroll_calculations.push(...nextCalculations);
  draft.payroll_periods = draft.payroll_periods.map((item) =>
    item.id === period.id
      ? {
          ...item,
          status: "liquidado",
          updated_at: currentTimestamp,
        }
      : item,
  );

  recordAudit(
    draft,
    user,
    existingCalculations.length ? "recalcular_periodo" : "liquidar_periodo",
    "payroll_periods",
    period.id,
    existingCalculations,
    nextCalculations,
  );
  touchMeta(draft);
  return draft;
}

export function getPeriodCalculations(database, periodId) {
  const employees = Object.fromEntries(database.employees.map((employee) => [employee.id, employee]));
  const assignments = Object.fromEntries(
    database.schedule_assignments
      .filter((assignment) => assignment.is_active && !assignment.deleted_at)
      .map((assignment) => [assignment.employee_id, assignment]),
  );

  return database.payroll_calculations
    .filter((calculation) => calculation.period_id === periodId)
    .map((calculation) => ({
      ...calculation,
      employee: employees[calculation.employee_id] || null,
      assignment: assignments[calculation.employee_id] || null,
      details: database.payroll_calculation_details.filter(
        (detail) => detail.calculation_id === calculation.id,
      ),
    }))
    .sort((left, right) => (right.total_pay || 0) - (left.total_pay || 0));
}

export function buildPeriodDataset(database, periodId, filters = {}) {
  const period = getPayrollPeriod(database, periodId);

  if (!period) {
    return [];
  }

  const calculations = getPeriodCalculations(database, periodId);
  const scheduleTemplates = Object.fromEntries(database.schedules.map((item) => [item.id, item]));
  const attendanceSummary = {};

  listAttendanceLogs(database, {
    start_date: period.start_date,
    end_date: period.end_date,
  }).forEach((entry) => {
    const current = attendanceSummary[entry.employee_id] || {
      worked_days: 0,
      night_hours: 0,
      sunday_hours: 0,
      festive_hours: 0,
      sunday_night_hours: 0,
    };

    current.worked_days += 1;
    current.night_hours += toNumber(entry.night_surcharge_hours);
    current.sunday_hours += toNumber(entry.sunday_hours);
    current.festive_hours += toNumber(entry.festive_hours);
    current.sunday_night_hours += toNumber(entry.sunday_night_hours);
    attendanceSummary[entry.employee_id] = current;
  });

  return calculations
    .filter((row) => {
      if (filters.employee_id && row.employee_id !== filters.employee_id) {
        return false;
      }

      if (filters.cargo && normalizeText(row.employee?.cargo) !== normalizeText(filters.cargo)) {
        return false;
      }

      if (filters.status && row.employee?.estado !== filters.status) {
        return false;
      }

      if (filters.tipo_empleado && row.employee?.tipo_empleado !== filters.tipo_empleado) {
        return false;
      }

      if (filters.search) {
        const haystack = normalizeText(
          `${row.employee?.nombre_completo || ""} ${row.employee?.cargo || ""} ${row.employee?.telefono || ""}`,
        );

        if (!haystack.includes(normalizeText(filters.search))) {
          return false;
        }
      }

      return true;
    })
    .map((row) => ({
      employee: row.employee,
      assignment: row.assignment,
      schedule: scheduleTemplates[row.assignment?.template_id] || null,
      calculation: row,
      attendance_summary: attendanceSummary[row.employee_id] || {
        worked_days: 0,
        night_hours: 0,
        sunday_hours: 0,
        festive_hours: 0,
        sunday_night_hours: 0,
      },
      period,
    }));
}

export function recordExportHistory(database, payload, currentUserEmail) {
  const draft = deepClone(database);
  const { user } = getCurrentUserContext(draft, currentUserEmail);
  const record = stamp({
    id: createRuntimeId("exp"),
    format: payload.format,
    file_name: payload.file_name,
    filters: payload.filters || {},
    period_id: payload.period_id || null,
    scope: payload.scope || "general",
    total_rows: payload.total_rows || 0,
    generated_by: user?.email || "system",
    generated_at: nowIso(),
  });

  draft.exports_history.unshift(record);
  recordAudit(draft, user, "exportar_archivos", "exports_history", record.id, null, record);
  touchMeta(draft);
  return draft;
}

function createNotificationRecord(payload, currentUser) {
  return stamp({
    id: createRuntimeId("notif"),
    employee_id: payload.employee_id,
    period_id: payload.period_id || null,
    schedule_assignment_id: payload.schedule_assignment_id || null,
    type: payload.type,
    status: "pendiente",
    phone: payload.phone,
    provider: payload.provider,
    message: payload.message,
    attachments: payload.attachments || [],
    sent_by: currentUser?.email || "system",
    sent_at: null,
    error_message: "",
    external_id: "",
  });
}

async function sendNotification(database, notificationPayload, currentUserEmail, provider = "stub") {
  const draft = deepClone(database);
  const { user } = getCurrentUserContext(draft, currentUserEmail);
  const service = createWhatsAppService(provider);
  const notification = createNotificationRecord(
    {
      ...notificationPayload,
      provider: service.name,
    },
    user,
  );

  draft.notifications.unshift(notification);
  recordAudit(draft, user, "crear_notificacion", "notifications", notification.id, null, notification);

  try {
    const result = await service.sendMessage({
      to: notification.phone,
      body: notification.message,
      attachments: notification.attachments,
    });

    const updatedNotification = {
      ...notification,
      status: result.status || "enviado",
      sent_at: result.delivered_at || nowIso(),
      external_id: result.external_id || "",
    };

    draft.notifications = draft.notifications.map((item) =>
      item.id === notification.id ? updatedNotification : item,
    );
    recordAudit(
      draft,
      user,
      "enviar_whatsapp",
      "notifications",
      notification.id,
      notification,
      updatedNotification,
    );
  } catch (error) {
    const failedNotification = {
      ...notification,
      status: "error",
      error_message: error.message || "No fue posible enviar el mensaje.",
      sent_at: nowIso(),
    };

    draft.notifications = draft.notifications.map((item) =>
      item.id === notification.id ? failedNotification : item,
    );
    recordAudit(
      draft,
      user,
      "error_whatsapp",
      "notifications",
      notification.id,
      notification,
      failedNotification,
    );
  }

  touchMeta(draft);
  return draft;
}

export async function sendPayslipNotification(database, employeeId, periodId, currentUserEmail, provider = "stub") {
  const employee = getEmployeeById(database, employeeId);
  const period = getPayrollPeriod(database, periodId);
  const calculation =
    getPeriodCalculations(database, periodId).find((item) => item.employee_id === employeeId) || null;

  if (!employee || !period || !calculation) {
    throw new Error("No se encontró la información necesaria para enviar la tirilla.");
  }

  const payslip = buildPaySlip(employee, period, calculation);

  return sendNotification(
    database,
    {
      employee_id: employee.id,
      period_id: period.id,
      type: "tirilla_pago",
      phone: employee.telefono,
      message: buildPayslipMessage(employee, period, payslip),
      attachments: [
        {
          type: "payslip",
          name: `tirilla-${normalizeText(employee.nombre_completo) || employee.id}-${period.id}.pdf`,
        },
      ],
    },
    currentUserEmail,
    provider,
  );
}

export async function sendScheduleNotification(database, employeeId, currentUserEmail, provider = "stub") {
  const employee = getEmployeeById(database, employeeId);
  const assignment = getEmployeeScheduleAssignment(database, employeeId);
  const schedule = assignment ? getScheduleTemplate(database, assignment.template_id) : null;

  if (!employee || !assignment || !schedule) {
    throw new Error("No se encontró la información necesaria para enviar el horario.");
  }

  return sendNotification(
    database,
    {
      employee_id: employee.id,
      schedule_assignment_id: assignment.id,
      type: "horario_individual",
      phone: employee.telefono,
      message: buildScheduleMessage(employee, assignment, schedule),
      attachments: [
        {
          type: "schedule",
          name: `horario-${normalizeText(employee.nombre_completo) || employee.id}-${assignment.id}.pdf`,
        },
      ],
    },
    currentUserEmail,
    provider,
  );
}

export function buildWorkforceStats(database, periodId = "") {
  const employees = listEmployees(database);
  const activeEmployees = employees.filter((employee) => employee.estado === "activo");
  const inactiveEmployees = employees.filter((employee) => employee.estado !== "activo");
  const period = periodId ? getPayrollPeriod(database, periodId) : listPayrollPeriods(database)[0] || null;
  const calculations = period ? getPeriodCalculations(database, period.id) : [];

  return {
    total_employees: employees.length,
    active_employees: activeEmployees.length,
    inactive_employees: inactiveEmployees.length,
    total_period_pay: calculations.reduce((sum, item) => sum + toNumber(item.total_pay), 0),
    total_period_extra_hours: calculations.reduce((sum, item) => sum + toNumber(item.extra_hours), 0),
    total_notifications: database.notifications.length,
    pending_notifications: database.notifications.filter((item) => item.status === "pendiente").length,
    total_exports: database.exports_history.length,
    open_period: period,
  };
}

export function getRecentAuditLogs(database, limit = 12) {
  return database.audit_logs.slice(0, limit);
}

export function syncLegacySummary(database, legacyEmployees, currentUserEmail, sourceName = "legacy_import") {
  const draft = deepClone(database);
  const { user } = getCurrentUserContext(draft, currentUserEmail);
  const currentTimestamp = nowIso();

  legacyEmployees.forEach((legacyEmployee) => {
    const fullName = String(legacyEmployee.employeeName || "").trim();
    const documentNumber = String(legacyEmployee.documentNumber || "").trim();

    if (!fullName) {
      return;
    }

    let employee =
      draft.employees.find(
        (item) =>
          !item.deleted_at &&
          (normalizeText(item.nombre_completo) === normalizeText(fullName) ||
            (documentNumber && normalizeText(item.telefono) === normalizeText(documentNumber))),
      ) || null;

    if (!employee) {
      const parts = fullName.split(/\s+/);
      employee = normalizeEmployee({
        id: createRuntimeId("emp"),
        nombres: parts.slice(0, -1).join(" ") || parts[0] || "",
        apellidos: parts.length > 1 ? parts.at(-1) : "",
        nombre_completo: fullName,
        cargo: "Pendiente de clasificar",
        telefono: "",
        tipo_empleado: "regular",
        periodicidad_pago: "quincenal",
        salario_base: toNumber(legacyEmployee.baseSalary),
        dia_descanso: "domingo",
        created_at: currentTimestamp,
        updated_at: currentTimestamp,
      });

      draft.employees.push(employee);
      syncEmployeeDerivedCollections(draft, employee, currentTimestamp);
      draft.schedule_assignments.push(
        normalizeScheduleAssignment({
          employee_id: employee.id,
          template_id: getDefaultTemplateId(employee),
          start_date: legacyEmployee.periodDate || CURRENT_DATE,
          end_date: legacyEmployee.periodDate || CURRENT_DATE,
          rest_day: employee.dia_descanso,
          notes: "Asignación creada desde importación heredada.",
        }),
      );
    }

    const quantityMap = Object.fromEntries(
      toArray(legacyEmployee.breakdown).map((line) => [line.key, toNumber(line.quantity)]),
    );
    const entry = normalizeAttendanceEntry({
      employee_id: employee.id,
      date: legacyEmployee.periodDate || CURRENT_DATE,
      ordinary_hours: 0,
      extra_day_hours: quantityMap.extraDay,
      extra_night_hours: quantityMap.extraNight,
      night_surcharge_hours: quantityMap.nightSurcharge,
      sunday_hours: quantityMap.sundayDaySurcharge,
      festive_hours: 0,
      sunday_night_hours: quantityMap.sundayNightSurcharge,
      novelty_type: "normal",
      notes: `Importado desde ${sourceName}.`,
      source: `legacy:${sourceName}`,
      created_at: currentTimestamp,
      updated_at: currentTimestamp,
    });

    draft.attendance_logs.push(entry);
  });

  recordAudit(
    draft,
    user,
    "sincronizar_importacion_legacy",
    "attendance_logs",
    sourceName,
    null,
    {
      source: sourceName,
      rows: legacyEmployees.length,
    },
  );
  touchMeta(draft);
  return draft;
}
