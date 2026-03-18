import { useEffect, useState } from "react";
import {
  CONTRACT_TYPES,
  EMPLOYEE_TYPE_DEFINITIONS,
  NOVELTY_TYPES,
  PAYMENT_FREQUENCIES,
  PERIOD_TYPES,
  SCHEDULE_TEMPLATES,
  WEEK_DAYS,
} from "./data";
import {
  buildPeriodDataset,
  buildWorkforceStats,
  calculateAndStorePayroll,
  getCurrentUserContext,
  getEmployeeById,
  getEmployeeScheduleAssignment,
  getPayrollPeriod,
  getPeriodCalculations,
  getRecentAuditLogs,
  listAttendanceLogs,
  listEmployees,
  listPayrollPeriods,
  loadWorkforceDatabase,
  persistWorkforceDatabase,
  recordExportHistory,
  resetWorkforceDatabase,
  sendPayslipNotification,
  sendScheduleNotification,
  softDeleteAttendanceLog,
  softDeleteEmployee,
  softDeleteScheduleAssignment,
  syncLegacySummary,
  upsertAttendanceLog,
  upsertEmployee,
  upsertPayrollPeriod,
  upsertScheduleAssignment,
} from "./store";
import { buildPaySlip } from "./payrollEngine";
import {
  exportDatasetToExcel,
  exportDatasetToPdf,
  exportPayslipToPdf,
} from "./exportService";
import { formatCurrency, formatNumber, normalizeText } from "../../lib/overtime";

const SECTION_OPTIONS = [
  { id: "employees", label: "Empleados" },
  { id: "schedules", label: "Horarios y novedades" },
  { id: "payroll", label: "Liquidaciones" },
  { id: "exports", label: "Exportaciones" },
  { id: "notifications", label: "Notificaciones" },
];

const DAY_LABELS = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

const WHATSAPP_PROVIDERS = [
  { id: "stub", label: "Stub interno" },
  { id: "cloud_api", label: "WhatsApp Cloud API" },
  { id: "twilio", label: "Twilio" },
];

const BRAND_NAME = "KAIKO";
const BRAND_RGB = [159, 31, 239];

function getEmployeeType(typeId) {
  return EMPLOYEE_TYPE_DEFINITIONS.find((item) => item.id === typeId) || EMPLOYEE_TYPE_DEFINITIONS[2];
}

function createEmployeeDraft(typeId = "regular") {
  const defaults = getEmployeeType(typeId).defaults;

  return {
    id: "",
    nombres: "",
    apellidos: "",
    nombre_completo: "",
    cargo: "",
    telefono: "",
    tipo_empleado: typeId,
    estado: defaults.estado || "activo",
    fecha_ingreso: "2026-03-18",
    observaciones: "",
    tipo_contrato: defaults.tipo_contrato || "termino_indefinido",
    salario_base: 0,
    periodicidad_pago: defaults.periodicidad_pago || "mensual",
    bono_mensual: 0,
    auxilio_transporte: 0,
    horas_semanales_contratadas: defaults.horas_semanales_contratadas || 46,
    aplica_horas_extras: defaults.aplica_horas_extras,
    aplica_recargo_nocturno: defaults.aplica_recargo_nocturno,
    aplica_recargo_dominical: defaults.aplica_recargo_dominical,
    aplica_recargo_festivo: defaults.aplica_recargo_festivo,
    aplica_recargo_nocturno_dominical: defaults.aplica_recargo_nocturno_dominical,
    es_cargo_manejo_confianza: defaults.es_cargo_manejo_confianza,
    dia_descanso: "domingo",
    notas_liquidacion: "",
    descuentos_fijos: 0,
  };
}

function hydrateEmployeeForm(employee) {
  return {
    id: employee.id,
    nombres: employee.nombres,
    apellidos: employee.apellidos,
    nombre_completo: employee.nombre_completo,
    cargo: employee.cargo,
    telefono: employee.telefono,
    tipo_empleado: employee.tipo_empleado,
    estado: employee.estado,
    fecha_ingreso: employee.fecha_ingreso,
    observaciones: employee.observaciones,
    tipo_contrato: employee.tipo_contrato,
    salario_base: employee.salario_base,
    periodicidad_pago: employee.periodicidad_pago,
    bono_mensual: employee.bono_mensual,
    auxilio_transporte: employee.auxilio_transporte,
    horas_semanales_contratadas: employee.horas_semanales_contratadas,
    aplica_horas_extras: employee.aplica_horas_extras,
    aplica_recargo_nocturno: employee.aplica_recargo_nocturno,
    aplica_recargo_dominical: employee.aplica_recargo_dominical,
    aplica_recargo_festivo: employee.aplica_recargo_festivo,
    aplica_recargo_nocturno_dominical: employee.aplica_recargo_nocturno_dominical,
    es_cargo_manejo_confianza: employee.es_cargo_manejo_confianza,
    dia_descanso: employee.dia_descanso,
    notas_liquidacion: employee.notas_liquidacion,
    descuentos_fijos: employee.descuentos_fijos || 0,
  };
}

function createScheduleDraft(employeeId = "", restDay = "domingo") {
  return {
    id: "",
    employee_id: employeeId,
    template_id: SCHEDULE_TEMPLATES[0].id,
    start_date: "2026-03-16",
    end_date: "2026-03-31",
    rest_day: restDay,
    override_rest_day: false,
    is_active: true,
    notes: "",
  };
}

function hydrateScheduleForm(assignment) {
  return {
    id: assignment.id,
    employee_id: assignment.employee_id,
    template_id: assignment.template_id,
    start_date: assignment.start_date,
    end_date: assignment.end_date,
    rest_day: assignment.rest_day,
    override_rest_day: assignment.override_rest_day,
    is_active: assignment.is_active,
    notes: assignment.notes,
  };
}

function createAttendanceDraft(employeeId = "", date = "2026-03-18") {
  return {
    id: "",
    employee_id: employeeId,
    date,
    ordinary_hours: 0,
    extra_day_hours: 0,
    extra_night_hours: 0,
    night_surcharge_hours: 0,
    sunday_hours: 0,
    festive_hours: 0,
    sunday_night_hours: 0,
    novelty_type: "normal",
    notes: "",
  };
}

function hydrateAttendanceForm(entry) {
  return {
    id: entry.id,
    employee_id: entry.employee_id,
    date: entry.date,
    ordinary_hours: entry.ordinary_hours,
    extra_day_hours: entry.extra_day_hours,
    extra_night_hours: entry.extra_night_hours,
    night_surcharge_hours: entry.night_surcharge_hours,
    sunday_hours: entry.sunday_hours,
    festive_hours: entry.festive_hours,
    sunday_night_hours: entry.sunday_night_hours,
    novelty_type: entry.novelty_type,
    notes: entry.notes,
  };
}

function createPeriodDraft() {
  return {
    id: "",
    label: "",
    period_type: "quincenal",
    start_date: "2026-03-16",
    end_date: "2026-03-31",
    status: "abierto",
  };
}

function hydratePeriodForm(period) {
  return {
    id: period.id,
    label: period.label,
    period_type: period.period_type,
    start_date: period.start_date,
    end_date: period.end_date,
    status: period.status,
  };
}

function formatDay(value) {
  return DAY_LABELS[value] || value;
}

function renderScheduleBlocks(schedule) {
  if (!schedule) {
    return "Sin horario asignado.";
  }

  return WEEK_DAYS.map((day) => {
    const blocks = schedule.blocks?.[day] || [];
    const label = formatDay(day);

    if (!blocks.length) {
      return `${label}: descanso`;
    }

    return `${label}: ${blocks.map((block) => `${block.start} - ${block.end}`).join(" / ")}`;
  }).join("\n");
}

function buildFileName(prefix, suffix) {
  return `${normalizeText(prefix) || "kaiko"}-${normalizeText(suffix) || "reporte"}`;
}

function WorkforceModule({
  currentUserEmail,
  legacyEmployees = [],
  legacyFileName = "",
  onNotice = () => {},
}) {
  const [database, setDatabase] = useState(() => loadWorkforceDatabase());
  const [activeSection, setActiveSection] = useState("employees");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [employeeFilters, setEmployeeFilters] = useState({
    search: "",
    cargo: "",
    status: "",
    tipo_empleado: "",
  });
  const [exportFilters, setExportFilters] = useState({
    search: "",
    cargo: "",
    status: "",
    tipo_empleado: "",
    employee_id: "",
  });
  const [employeeForm, setEmployeeForm] = useState(() => createEmployeeDraft());
  const [scheduleForm, setScheduleForm] = useState(() => createScheduleDraft());
  const [attendanceForm, setAttendanceForm] = useState(() => createAttendanceDraft());
  const [periodForm, setPeriodForm] = useState(() => createPeriodDraft());
  const [provider, setProvider] = useState("stub");
  const [allowReprocess, setAllowReprocess] = useState(false);

  useEffect(() => {
    persistWorkforceDatabase(database);
  }, [database]);

  const userContext = getCurrentUserContext(database, currentUserEmail);
  const periods = listPayrollPeriods(database);
  const employees = listEmployees(database, employeeFilters);
  const allEmployees = listEmployees(database);
  const selectedEmployee = getEmployeeById(database, selectedEmployeeId) || employees[0] || allEmployees[0] || null;
  const selectedAssignment = selectedEmployee
    ? getEmployeeScheduleAssignment(database, selectedEmployee.id)
    : null;
  const selectedPeriod = getPayrollPeriod(database, selectedPeriodId) || periods[0] || null;
  const attendanceLogs = listAttendanceLogs(database, {
    employee_id: selectedEmployee?.id,
    start_date: selectedPeriod?.start_date,
    end_date: selectedPeriod?.end_date,
  });
  const periodCalculations = selectedPeriod ? getPeriodCalculations(database, selectedPeriod.id) : [];
  const selectedCalculation =
    periodCalculations.find((item) => item.employee_id === selectedEmployee?.id) || periodCalculations[0] || null;
  const dataset = selectedPeriod ? buildPeriodDataset(database, selectedPeriod.id, exportFilters) : [];
  const stats = buildWorkforceStats(database, selectedPeriod?.id);
  const auditLogs = getRecentAuditLogs(database, 14);
  const notifications = database.notifications.slice(0, 20);
  const selectedPayslip =
    selectedEmployee && selectedPeriod && selectedCalculation
      ? buildPaySlip(selectedEmployee, selectedPeriod, selectedCalculation)
      : null;

  function commitDatabase(nextDatabase, successMessage, type = "success") {
    setDatabase(nextDatabase);

    if (successMessage) {
      onNotice(successMessage, type);
    }
  }

  async function runAction(label, task, successMessage) {
    try {
      const nextDatabase = await task();

      if (nextDatabase) {
        commitDatabase(nextDatabase, successMessage);
      } else if (successMessage) {
        onNotice(successMessage, "success");
      }
    } catch (error) {
      onNotice(error.message || `No fue posible completar ${label}.`, "error");
    }
  }

  function resetEmployeeForm(typeId = "regular") {
    setEmployeeForm(createEmployeeDraft(typeId));
  }

  function resetScheduleForm() {
    setScheduleForm(createScheduleDraft(selectedEmployee?.id || "", selectedEmployee?.dia_descanso || "domingo"));
  }

  function resetAttendanceForm() {
    setAttendanceForm(createAttendanceDraft(selectedEmployee?.id || "", selectedPeriod?.end_date || "2026-03-18"));
  }

  function resetPeriodForm() {
    setPeriodForm(createPeriodDraft());
  }

  function handleEmployeeTypeChange(typeId) {
    const defaults = getEmployeeType(typeId).defaults;

    setEmployeeForm((current) => ({
      ...current,
      tipo_empleado: typeId,
      tipo_contrato: defaults.tipo_contrato || current.tipo_contrato,
      periodicidad_pago: defaults.periodicidad_pago || current.periodicidad_pago,
      horas_semanales_contratadas:
        defaults.horas_semanales_contratadas ?? current.horas_semanales_contratadas,
      aplica_horas_extras: defaults.aplica_horas_extras,
      aplica_recargo_nocturno: defaults.aplica_recargo_nocturno,
      aplica_recargo_dominical: defaults.aplica_recargo_dominical,
      aplica_recargo_festivo: defaults.aplica_recargo_festivo,
      aplica_recargo_nocturno_dominical: defaults.aplica_recargo_nocturno_dominical,
      es_cargo_manejo_confianza: defaults.es_cargo_manejo_confianza,
      estado: defaults.estado || current.estado,
    }));
  }

  function selectEmployeeForEditing(employee) {
    const employeeAssignment = getEmployeeScheduleAssignment(database, employee.id);
    setSelectedEmployeeId(employee.id);
    setEmployeeForm(hydrateEmployeeForm(employee));
    setScheduleForm(
      employeeAssignment
        ? hydrateScheduleForm(employeeAssignment)
        : createScheduleDraft(employee.id, employee.dia_descanso),
    );
    setAttendanceForm(createAttendanceDraft(employee.id, selectedPeriod?.end_date || "2026-03-18"));
  }

  function selectLogForEditing(entry) {
    setAttendanceForm(hydrateAttendanceForm(entry));
  }

  function selectPeriodForEditing(period) {
    setSelectedPeriodId(period.id);
    setPeriodForm(hydratePeriodForm(period));
  }

  async function handleEmployeeSubmit(event) {
    event.preventDefault();

    await runAction(
      "guardar empleado",
      async () => {
        const nextDatabase = upsertEmployee(
          database,
          {
            ...employeeForm,
            nombre_completo:
              employeeForm.nombre_completo ||
              `${employeeForm.nombres} ${employeeForm.apellidos}`.trim(),
          },
          currentUserEmail,
        );
        const nextSelectedEmployee =
          getEmployeeById(nextDatabase, employeeForm.id) ||
          listEmployees(nextDatabase).find(
            (item) =>
              normalizeText(item.nombre_completo) ===
              normalizeText(
                employeeForm.nombre_completo ||
                  `${employeeForm.nombres} ${employeeForm.apellidos}`.trim(),
              ),
          );

        setSelectedEmployeeId(nextSelectedEmployee?.id || "");
        setEmployeeForm(
          nextSelectedEmployee ? hydrateEmployeeForm(nextSelectedEmployee) : createEmployeeDraft(),
        );
        return nextDatabase;
      },
      "Empleado guardado correctamente.",
    );
  }

  async function handleDeleteEmployee() {
    if (!employeeForm.id) {
      onNotice("Selecciona un empleado existente para eliminar.", "warning");
      return;
    }

    await runAction(
      "eliminar empleado",
      async () => softDeleteEmployee(database, employeeForm.id, currentUserEmail),
      "Empleado marcado como inactivo.",
    );
    resetEmployeeForm();
  }

  async function handleScheduleSubmit(event) {
    event.preventDefault();

    await runAction(
      "guardar horario",
      async () => upsertScheduleAssignment(database, scheduleForm, currentUserEmail),
      "Horario guardado correctamente.",
    );
  }

  async function handleDeleteSchedule() {
    if (!scheduleForm.id) {
      onNotice("Selecciona un horario existente para eliminar.", "warning");
      return;
    }

    await runAction(
      "eliminar horario",
      async () => softDeleteScheduleAssignment(database, scheduleForm.id, currentUserEmail),
      "Horario eliminado del período activo.",
    );
    resetScheduleForm();
  }

  async function handleAttendanceSubmit(event) {
    event.preventDefault();

    await runAction(
      "guardar novedad",
      async () => upsertAttendanceLog(database, attendanceForm, currentUserEmail),
      "Novedad registrada correctamente.",
    );
    resetAttendanceForm();
  }

  async function handleDeleteAttendance() {
    if (!attendanceForm.id) {
      onNotice("Selecciona una novedad existente para eliminar.", "warning");
      return;
    }

    await runAction(
      "eliminar novedad",
      async () => softDeleteAttendanceLog(database, attendanceForm.id, currentUserEmail),
      "Novedad eliminada correctamente.",
    );
    resetAttendanceForm();
  }

  async function handlePeriodSubmit(event) {
    event.preventDefault();

    await runAction(
      "guardar período",
      async () =>
        upsertPayrollPeriod(database, periodForm, currentUserEmail, {
          allowReprocess,
        }),
      "Período guardado correctamente.",
    );
  }

  async function handleCalculatePeriod() {
    if (!selectedPeriod?.id) {
      onNotice("Selecciona un período para liquidar.", "warning");
      return;
    }

    await runAction(
      "liquidar período",
      async () =>
        calculateAndStorePayroll(database, selectedPeriod.id, currentUserEmail, {
          allowReprocess,
        }),
      allowReprocess
        ? "Período recalculado correctamente."
        : "Período liquidado correctamente.",
    );
  }

  async function handleExportDataset(format) {
    if (!selectedPeriod?.id || !dataset.length) {
      onNotice("No hay datos liquidados para exportar.", "warning");
      return;
    }

    const fileNameBase = buildFileName(selectedPeriod.label, format);

    await runAction(
      `exportar ${format}`,
      async () => {
        if (format === "excel") {
          await exportDatasetToExcel(dataset, fileNameBase);
        } else {
          await exportDatasetToPdf(dataset, {
            brandName: BRAND_NAME,
            brandRgb: BRAND_RGB,
            title: "Exportación consolidada de liquidación",
            subtitle: `${selectedPeriod.label} · ${dataset.length} registros`,
            fileNameBase,
          });
        }

        return recordExportHistory(
          database,
          {
            format,
            file_name: fileNameBase,
            filters: exportFilters,
            period_id: selectedPeriod.id,
            scope: exportFilters.employee_id ? "individual" : "consolidado",
            total_rows: dataset.length,
          },
          currentUserEmail,
        );
      },
      `Exportación ${format.toUpperCase()} generada correctamente.`,
    );
  }

  async function handleExportPayslip() {
    if (!selectedPayslip || !selectedEmployee || !selectedPeriod) {
      onNotice("Selecciona una liquidación válida para exportar la tirilla.", "warning");
      return;
    }

    const fileNameBase = buildFileName(selectedEmployee.nombre_completo, selectedPeriod.label);

    await runAction(
      "exportar tirilla",
      async () => {
        await exportPayslipToPdf(selectedPayslip, {
          brandName: BRAND_NAME,
          brandRgb: BRAND_RGB,
          fileNameBase,
        });

        return recordExportHistory(
          database,
          {
            format: "pdf",
            file_name: fileNameBase,
            filters: {
              employee_id: selectedEmployee.id,
            },
            period_id: selectedPeriod.id,
            scope: "tirilla_individual",
            total_rows: 1,
          },
          currentUserEmail,
        );
      },
      "Tirilla PDF generada correctamente.",
    );
  }

  async function handleSyncLegacy() {
    if (!legacyEmployees.length) {
      onNotice("No hay una base Excel activa para sincronizar al módulo laboral.", "warning");
      return;
    }

    await runAction(
      "sincronizar importación",
      async () => syncLegacySummary(database, legacyEmployees, currentUserEmail, legacyFileName),
      "La base Excel fue sincronizada al módulo laboral.",
    );
  }

  async function handleSendPayslip() {
    if (!selectedEmployee || !selectedPeriod) {
      onNotice("Selecciona una persona y una quincena válida para enviar la tirilla.", "warning");
      return;
    }

    await runAction(
      "enviar tirilla",
      async () =>
        sendPayslipNotification(
          database,
          selectedEmployee.id,
          selectedPeriod.id,
          currentUserEmail,
          provider,
        ),
      "La tirilla fue enviada o quedó registrada en cola.",
    );
  }

  async function handleSendSchedule() {
    if (!selectedEmployee) {
      onNotice("Selecciona una persona para enviar el horario.", "warning");
      return;
    }

    await runAction(
      "enviar horario",
      async () => sendScheduleNotification(database, selectedEmployee.id, currentUserEmail, provider),
      "El horario individual fue enviado o quedó registrado en cola.",
    );
  }

  function handleResetModule() {
    commitDatabase(resetWorkforceDatabase(), "Base local restablecida con los datos semilla.");
    resetEmployeeForm();
    resetScheduleForm();
    resetAttendanceForm();
    resetPeriodForm();
  }

  const employeeTypeOptions = EMPLOYEE_TYPE_DEFINITIONS;
  const cargoOptions = [...new Set(allEmployees.map((employee) => employee.cargo).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
  const exportHistory = database.exports_history.slice(0, 12);

  function renderEmployeesSection() {
    return (
      <div className="dashboard-grid">
        <section className="panel panel-list">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Listado</p>
              <h2>Empleados y perfiles</h2>
            </div>
            <button className="button ghost" onClick={() => resetEmployeeForm()}>
              Nuevo empleado
            </button>
          </div>

          <div className="form-grid compact">
            <label>
              Buscar
              <input
                type="search"
                value={employeeFilters.search}
                onChange={(event) =>
                  setEmployeeFilters((current) => ({ ...current, search: event.target.value }))
                }
                placeholder="Nombre, cargo o teléfono"
              />
            </label>
            <label>
              Estado
              <select
                value={employeeFilters.status}
                onChange={(event) =>
                  setEmployeeFilters((current) => ({ ...current, status: event.target.value }))
                }
              >
                <option value="">Todos</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </label>
            <label>
              Tipo
              <select
                value={employeeFilters.tipo_empleado}
                onChange={(event) =>
                  setEmployeeFilters((current) => ({
                    ...current,
                    tipo_empleado: event.target.value,
                  }))
                }
              >
                <option value="">Todos</option>
                {employeeTypeOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Cargo
              <select
                value={employeeFilters.cargo}
                onChange={(event) =>
                  setEmployeeFilters((current) => ({ ...current, cargo: event.target.value }))
                }
              >
                <option value="">Todos</option>
                {cargoOptions.map((cargo) => (
                  <option key={cargo} value={cargo}>
                    {cargo}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="employee-list">
            {employees.map((employee) => (
              <button
                key={employee.id}
                className={`employee-item ${employee.id === selectedEmployee?.id ? "active" : ""}`}
                onClick={() => selectEmployeeForEditing(employee)}
              >
                <div>
                  <strong>{employee.nombre_completo}</strong>
                  <span>{employee.cargo}</span>
                  <small>{employee.telefono || "Sin teléfono"}</small>
                </div>
                <div className="employee-item-meta">
                  <span>{employee.estado}</span>
                  <small>{formatDay(employee.dia_descanso)}</small>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="panel panel-detail">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">CRUD completo</p>
              <h2>{employeeForm.id ? "Editar empleado" : "Crear empleado"}</h2>
            </div>
            {selectedEmployee ? (
              <div className="chip-group">
                <span>{selectedEmployee.cargo}</span>
                <span>{selectedEmployee.estado}</span>
                <span>{getEmployeeType(selectedEmployee.tipo_empleado).label}</span>
              </div>
            ) : null}
          </div>

          <form className="module-form" onSubmit={handleEmployeeSubmit}>
            <div className="form-grid">
              <label>
                Nombres
                <input
                  value={employeeForm.nombres}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({ ...current, nombres: event.target.value }))
                  }
                />
              </label>
              <label>
                Apellidos
                <input
                  value={employeeForm.apellidos}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({ ...current, apellidos: event.target.value }))
                  }
                />
              </label>
              <label>
                Nombre completo
                <input
                  value={employeeForm.nombre_completo}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({
                      ...current,
                      nombre_completo: event.target.value,
                    }))
                  }
                  placeholder="Se completa automáticamente si lo dejas vacío"
                />
              </label>
              <label>
                Cargo
                <input
                  value={employeeForm.cargo}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({ ...current, cargo: event.target.value }))
                  }
                />
              </label>
              <label>
                Teléfono
                <input
                  value={employeeForm.telefono}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({ ...current, telefono: event.target.value }))
                  }
                  placeholder="3001234567"
                />
              </label>
              <label>
                Tipo de empleado
                <select
                  value={employeeForm.tipo_empleado}
                  onChange={(event) => handleEmployeeTypeChange(event.target.value)}
                >
                  {employeeTypeOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Estado
                <select
                  value={employeeForm.estado}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({ ...current, estado: event.target.value }))
                  }
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </label>
              <label>
                Fecha de ingreso
                <input
                  type="date"
                  value={employeeForm.fecha_ingreso}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({
                      ...current,
                      fecha_ingreso: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Día de descanso
                <select
                  value={employeeForm.dia_descanso}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({
                      ...current,
                      dia_descanso: event.target.value,
                    }))
                  }
                >
                  {WEEK_DAYS.map((day) => (
                    <option key={day} value={day}>
                      {formatDay(day)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tipo de contrato
                <select
                  value={employeeForm.tipo_contrato}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({
                      ...current,
                      tipo_contrato: event.target.value,
                    }))
                  }
                >
                  {CONTRACT_TYPES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Periodicidad de pago
                <select
                  value={employeeForm.periodicidad_pago}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({
                      ...current,
                      periodicidad_pago: event.target.value,
                    }))
                  }
                >
                  {PAYMENT_FREQUENCIES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Salario base
                <input
                  type="number"
                  min="0"
                  value={employeeForm.salario_base}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({
                      ...current,
                      salario_base: Number(event.target.value) || 0,
                    }))
                  }
                />
              </label>
              <label>
                Bono mensual
                <input
                  type="number"
                  min="0"
                  value={employeeForm.bono_mensual}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({
                      ...current,
                      bono_mensual: Number(event.target.value) || 0,
                    }))
                  }
                />
              </label>
              <label>
                Auxilio transporte
                <input
                  type="number"
                  min="0"
                  value={employeeForm.auxilio_transporte}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({
                      ...current,
                      auxilio_transporte: Number(event.target.value) || 0,
                    }))
                  }
                />
              </label>
              <label>
                Horas contratadas por semana
                <input
                  type="number"
                  min="0"
                  value={employeeForm.horas_semanales_contratadas}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({
                      ...current,
                      horas_semanales_contratadas: Number(event.target.value) || 0,
                    }))
                  }
                />
              </label>
              <label>
                Descuentos fijos
                <input
                  type="number"
                  min="0"
                  value={employeeForm.descuentos_fijos}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({
                      ...current,
                      descuentos_fijos: Number(event.target.value) || 0,
                    }))
                  }
                />
              </label>
            </div>

            <div className="checkbox-grid">
              <label><input type="checkbox" checked={employeeForm.aplica_horas_extras} onChange={(event) => setEmployeeForm((current) => ({ ...current, aplica_horas_extras: event.target.checked }))} />Aplica horas extras</label>
              <label><input type="checkbox" checked={employeeForm.aplica_recargo_nocturno} onChange={(event) => setEmployeeForm((current) => ({ ...current, aplica_recargo_nocturno: event.target.checked }))} />Aplica recargo nocturno</label>
              <label><input type="checkbox" checked={employeeForm.aplica_recargo_dominical} onChange={(event) => setEmployeeForm((current) => ({ ...current, aplica_recargo_dominical: event.target.checked }))} />Aplica dominical</label>
              <label><input type="checkbox" checked={employeeForm.aplica_recargo_festivo} onChange={(event) => setEmployeeForm((current) => ({ ...current, aplica_recargo_festivo: event.target.checked }))} />Aplica festivo</label>
              <label><input type="checkbox" checked={employeeForm.aplica_recargo_nocturno_dominical} onChange={(event) => setEmployeeForm((current) => ({ ...current, aplica_recargo_nocturno_dominical: event.target.checked }))} />Aplica dominical nocturno</label>
              <label><input type="checkbox" checked={employeeForm.es_cargo_manejo_confianza} onChange={(event) => setEmployeeForm((current) => ({ ...current, es_cargo_manejo_confianza: event.target.checked }))} />Cargo de manejo y confianza</label>
            </div>

            <div className="form-grid compact">
              <label>
                Observaciones
                <textarea
                  rows="4"
                  value={employeeForm.observaciones}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({
                      ...current,
                      observaciones: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Notas de liquidación
                <textarea
                  rows="4"
                  value={employeeForm.notas_liquidacion}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({
                      ...current,
                      notas_liquidacion: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="button-row">
              <button className="button primary" type="submit">
                Guardar empleado
              </button>
              <button className="button ghost" type="button" onClick={() => resetEmployeeForm()}>
                Limpiar
              </button>
              <button className="button ghost" type="button" onClick={handleDeleteEmployee}>
                Eliminar
              </button>
            </div>
          </form>
        </section>

        <section className="panel panel-export">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Reglas activas</p>
              <h2>Resumen contractual y permisos</h2>
            </div>
          </div>

          <div className="ops-grid">
            <article className="surface-card">
              <h3>Empleado seleccionado</h3>
              {selectedEmployee ? (
                <dl className="definition-grid">
                  <div>
                    <dt>Nombre</dt>
                    <dd>{selectedEmployee.nombre_completo}</dd>
                  </div>
                  <div>
                    <dt>Cargo</dt>
                    <dd>{selectedEmployee.cargo}</dd>
                  </div>
                  <div>
                    <dt>Salario base</dt>
                    <dd>{formatCurrency(selectedEmployee.salario_base)}</dd>
                  </div>
                  <div>
                    <dt>Tipo</dt>
                    <dd>{getEmployeeType(selectedEmployee.tipo_empleado).label}</dd>
                  </div>
                </dl>
              ) : (
                <div className="empty-state"><p>No hay empleado seleccionado.</p></div>
              )}
            </article>

            <article className="surface-card">
              <h3>Rol actual</h3>
              <p className="muted">{userContext.role.label}</p>
              <div className="chip-group">
                {userContext.permissions.map((permission) => (
                  <span key={permission}>{permission.replaceAll("_", " ")}</span>
                ))}
              </div>
            </article>
          </div>
        </section>
      </div>
    );
  }

  function renderSchedulesSection() {
    const scheduleTemplate = selectedAssignment
      ? SCHEDULE_TEMPLATES.find((item) => item.id === selectedAssignment.template_id)
      : SCHEDULE_TEMPLATES.find((item) => item.id === scheduleForm.template_id);

    return (
      <div className="dashboard-grid">
        <section className="panel panel-list">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Asignación</p>
              <h2>Horario individual</h2>
            </div>
            {selectedAssignment ? (
              <button
                className="button ghost"
                onClick={() => setScheduleForm(hydrateScheduleForm(selectedAssignment))}
              >
                Usar horario activo
              </button>
            ) : null}
          </div>

          <form className="module-form" onSubmit={handleScheduleSubmit}>
            <div className="form-grid compact">
              <label>
                Empleado
                <select
                  value={scheduleForm.employee_id}
                  onChange={(event) =>
                    setScheduleForm((current) => ({
                      ...current,
                      employee_id: event.target.value,
                    }))
                  }
                >
                  <option value="">Selecciona</option>
                  {allEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.nombre_completo}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Plantilla
                <select
                  value={scheduleForm.template_id}
                  onChange={(event) =>
                    setScheduleForm((current) => ({
                      ...current,
                      template_id: event.target.value,
                    }))
                  }
                >
                  {SCHEDULE_TEMPLATES.map((schedule) => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Fecha inicial
                <input
                  type="date"
                  value={scheduleForm.start_date}
                  onChange={(event) =>
                    setScheduleForm((current) => ({
                      ...current,
                      start_date: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Fecha final
                <input
                  type="date"
                  value={scheduleForm.end_date}
                  onChange={(event) =>
                    setScheduleForm((current) => ({
                      ...current,
                      end_date: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Día de descanso
                <select
                  value={scheduleForm.rest_day}
                  onChange={(event) =>
                    setScheduleForm((current) => ({
                      ...current,
                      rest_day: event.target.value,
                    }))
                  }
                >
                  {WEEK_DAYS.map((day) => (
                    <option key={day} value={day}>
                      {formatDay(day)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="toggle-field">
                <span>Override manual</span>
                <input
                  type="checkbox"
                  checked={scheduleForm.override_rest_day}
                  onChange={(event) =>
                    setScheduleForm((current) => ({
                      ...current,
                      override_rest_day: event.target.checked,
                    }))
                  }
                />
              </label>
              <label className="span-full">
                Notas
                <textarea
                  rows="3"
                  value={scheduleForm.notes}
                  onChange={(event) =>
                    setScheduleForm((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </label>
            </div>

            <div className="button-row">
              <button className="button primary" type="submit">
                Guardar horario
              </button>
              <button className="button ghost" type="button" onClick={resetScheduleForm}>
                Limpiar
              </button>
              <button className="button ghost" type="button" onClick={handleDeleteSchedule}>
                Eliminar
              </button>
            </div>
          </form>
        </section>

        <section className="panel panel-detail">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Plantilla</p>
              <h2>Vista del horario</h2>
            </div>
            {selectedEmployee ? (
              <div className="chip-group">
                <span>{selectedEmployee.nombre_completo}</span>
                <span>{formatDay(scheduleForm.rest_day || selectedEmployee.dia_descanso)}</span>
              </div>
            ) : null}
          </div>

          <article className="surface-card">
            <h3>{scheduleTemplate?.name || "Sin plantilla"}</h3>
            <pre className="schedule-preview">{renderScheduleBlocks(scheduleTemplate)}</pre>
          </article>
        </section>

        <section className="panel panel-export">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Marcaciones</p>
              <h2>Novedades y asistencia real</h2>
            </div>
          </div>

          <div className="ops-grid">
            <article className="surface-card">
              <h3>Registrar novedad</h3>
              <form className="module-form" onSubmit={handleAttendanceSubmit}>
                <div className="form-grid">
                  <label>
                    Empleado
                    <select
                      value={attendanceForm.employee_id}
                      onChange={(event) =>
                        setAttendanceForm((current) => ({
                          ...current,
                          employee_id: event.target.value,
                        }))
                      }
                    >
                      <option value="">Selecciona</option>
                      {allEmployees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.nombre_completo}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Fecha
                    <input
                      type="date"
                      value={attendanceForm.date}
                      onChange={(event) =>
                        setAttendanceForm((current) => ({ ...current, date: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Novedad
                    <select
                      value={attendanceForm.novelty_type}
                      onChange={(event) =>
                        setAttendanceForm((current) => ({
                          ...current,
                          novelty_type: event.target.value,
                        }))
                      }
                    >
                      {NOVELTY_TYPES.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Ordinarias
                    <input type="number" min="0" value={attendanceForm.ordinary_hours} onChange={(event) => setAttendanceForm((current) => ({ ...current, ordinary_hours: Number(event.target.value) || 0 }))} />
                  </label>
                  <label>
                    Extra diurna
                    <input type="number" min="0" value={attendanceForm.extra_day_hours} onChange={(event) => setAttendanceForm((current) => ({ ...current, extra_day_hours: Number(event.target.value) || 0 }))} />
                  </label>
                  <label>
                    Extra nocturna
                    <input type="number" min="0" value={attendanceForm.extra_night_hours} onChange={(event) => setAttendanceForm((current) => ({ ...current, extra_night_hours: Number(event.target.value) || 0 }))} />
                  </label>
                  <label>
                    Recargo nocturno
                    <input type="number" min="0" value={attendanceForm.night_surcharge_hours} onChange={(event) => setAttendanceForm((current) => ({ ...current, night_surcharge_hours: Number(event.target.value) || 0 }))} />
                  </label>
                  <label>
                    Dominical
                    <input type="number" min="0" value={attendanceForm.sunday_hours} onChange={(event) => setAttendanceForm((current) => ({ ...current, sunday_hours: Number(event.target.value) || 0 }))} />
                  </label>
                  <label>
                    Festivo
                    <input type="number" min="0" value={attendanceForm.festive_hours} onChange={(event) => setAttendanceForm((current) => ({ ...current, festive_hours: Number(event.target.value) || 0 }))} />
                  </label>
                  <label>
                    Dominical nocturno
                    <input type="number" min="0" value={attendanceForm.sunday_night_hours} onChange={(event) => setAttendanceForm((current) => ({ ...current, sunday_night_hours: Number(event.target.value) || 0 }))} />
                  </label>
                  <label className="span-full">
                    Notas
                    <textarea
                      rows="3"
                      value={attendanceForm.notes}
                      onChange={(event) =>
                        setAttendanceForm((current) => ({ ...current, notes: event.target.value }))
                      }
                    />
                  </label>
                </div>
                <div className="button-row">
                  <button className="button primary" type="submit">
                    Guardar novedad
                  </button>
                  <button className="button ghost" type="button" onClick={resetAttendanceForm}>
                    Limpiar
                  </button>
                  <button className="button ghost" type="button" onClick={handleDeleteAttendance}>
                    Eliminar
                  </button>
                </div>
              </form>
            </article>

            <article className="surface-card">
              <h3>Histórico del período</h3>
              <div className="table-shell mini-table">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Novedad</th>
                      <th>Horas</th>
                      <th>Notas</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceLogs.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.date}</td>
                        <td>{NOVELTY_TYPES.find((item) => item.id === entry.novelty_type)?.label || entry.novelty_type}</td>
                        <td>{formatNumber(entry.ordinary_hours + entry.extra_day_hours + entry.extra_night_hours + entry.night_surcharge_hours + entry.sunday_hours + entry.festive_hours + entry.sunday_night_hours)}</td>
                        <td>{entry.notes || "Sin notas"}</td>
                        <td>
                          <button className="button ghost button-inline" onClick={() => selectLogForEditing(entry)}>
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        </section>
      </div>
    );
  }

  function renderPayrollSection() {
    return (
      <div className="dashboard-grid">
        <section className="panel panel-import">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Períodos</p>
              <h2>Cálculo y control por quincena</h2>
            </div>
            <div className="button-row">
              <button className="button primary" onClick={handleCalculatePeriod}>
                {allowReprocess ? "Recalcular" : "Liquidar período"}
              </button>
              <label className="toggle-field">
                <span>Autorizar reproceso</span>
                <input
                  type="checkbox"
                  checked={allowReprocess}
                  onChange={(event) => setAllowReprocess(event.target.checked)}
                />
              </label>
            </div>
          </div>

          <div className="ops-grid">
            <article className="surface-card">
              <h3>Gestión de períodos</h3>
              <form className="module-form" onSubmit={handlePeriodSubmit}>
                <div className="form-grid compact">
                  <label>
                    Período actual
                    <select
                      value={selectedPeriod?.id || ""}
                      onChange={(event) => setSelectedPeriodId(event.target.value)}
                    >
                      <option value="">Selecciona</option>
                      {periods.map((period) => (
                        <option key={period.id} value={period.id}>
                          {period.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Estado
                    <input value={selectedPeriod?.status || "Sin estado"} readOnly />
                  </label>
                  <label>
                    Etiqueta
                    <input
                      value={periodForm.label}
                      onChange={(event) =>
                        setPeriodForm((current) => ({ ...current, label: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Tipo
                    <select
                      value={periodForm.period_type}
                      onChange={(event) =>
                        setPeriodForm((current) => ({
                          ...current,
                          period_type: event.target.value,
                        }))
                      }
                    >
                      {PERIOD_TYPES.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Fecha inicial
                    <input
                      type="date"
                      value={periodForm.start_date}
                      onChange={(event) =>
                        setPeriodForm((current) => ({
                          ...current,
                          start_date: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Fecha final
                    <input
                      type="date"
                      value={periodForm.end_date}
                      onChange={(event) =>
                        setPeriodForm((current) => ({
                          ...current,
                          end_date: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                <div className="button-row">
                  <button className="button primary" type="submit">
                    Guardar período
                  </button>
                  <button className="button ghost" type="button" onClick={resetPeriodForm}>
                    Limpiar
                  </button>
                  {selectedPeriod ? (
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() => selectPeriodForEditing(selectedPeriod)}
                    >
                      Editar actual
                    </button>
                  ) : null}
                </div>
              </form>
            </article>

            <article className="surface-card">
              <h3>Resumen del período</h3>
              <dl className="definition-grid">
                <div>
                  <dt>Empleados activos</dt>
                  <dd>{formatNumber(stats.active_employees, 0)}</dd>
                </div>
                <div>
                  <dt>Total liquidado</dt>
                  <dd>{formatCurrency(stats.total_period_pay)}</dd>
                </div>
                <div>
                  <dt>Horas extra del período</dt>
                  <dd>{formatNumber(stats.total_period_extra_hours)}</dd>
                </div>
                <div>
                  <dt>Notificaciones pendientes</dt>
                  <dd>{formatNumber(stats.pending_notifications, 0)}</dd>
                </div>
              </dl>
            </article>
          </div>
        </section>

        <section className="panel panel-list">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Resultados</p>
              <h2>Liquidación por empleado</h2>
            </div>
          </div>
          <div className="employee-list">
            {periodCalculations.map((item) => (
              <button
                key={item.id}
                className={`employee-item ${item.employee_id === selectedEmployee?.id ? "active" : ""}`}
                onClick={() => setSelectedEmployeeId(item.employee_id)}
              >
                <div>
                  <strong>{item.employee?.nombre_completo || "Sin nombre"}</strong>
                  <span>{item.employee?.cargo || "Sin cargo"}</span>
                  <small>{formatNumber(item.extra_hours)} horas extra</small>
                </div>
                <div className="employee-item-meta">
                  <span>{formatCurrency(item.total_pay)}</span>
                  <small>{formatCurrency(item.surcharge_value)} recargos</small>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="panel panel-detail">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Tirilla</p>
              <h2>{selectedPayslip ? selectedPayslip.employee_name : "Selecciona una liquidación"}</h2>
            </div>
            <div className="button-row">
              <button className="button ghost" onClick={handleExportPayslip}>
                Exportar tirilla PDF
              </button>
              <button className="button ghost" onClick={handleSendPayslip}>
                Enviar tirilla
              </button>
            </div>
          </div>

          {selectedPayslip ? (
            <>
              <div className="detail-hero">
                <article className="surface-card">
                  <h3>Encabezado</h3>
                  <dl className="definition-grid">
                    <div>
                      <dt>Período</dt>
                      <dd>{selectedPayslip.period_label}</dd>
                    </div>
                    <div>
                      <dt>Cargo</dt>
                      <dd>{selectedPayslip.position}</dd>
                    </div>
                    <div>
                      <dt>Bono</dt>
                      <dd>{formatCurrency(selectedPayslip.bonus)}</dd>
                    </div>
                    <div>
                      <dt>Auxilio</dt>
                      <dd>{formatCurrency(selectedPayslip.transport_allowance)}</dd>
                    </div>
                  </dl>
                </article>

                <article className="surface-card">
                  <h3>Total a pagar</h3>
                  <dl className="definition-grid">
                    <div>
                      <dt>Salario base</dt>
                      <dd>{formatCurrency(selectedPayslip.base_salary_period)}</dd>
                    </div>
                    <div>
                      <dt>Descuentos</dt>
                      <dd>{formatCurrency(selectedPayslip.discounts || 0)}</dd>
                    </div>
                    <div>
                      <dt>Horas extras</dt>
                      <dd>{formatCurrency(selectedPayslip.overtime_value)}</dd>
                    </div>
                    <div>
                      <dt>Recargos</dt>
                      <dd>{formatCurrency(selectedPayslip.surcharge_value)}</dd>
                    </div>
                    <div>
                      <dt>Total</dt>
                      <dd>{formatCurrency(selectedPayslip.total_pay)}</dd>
                    </div>
                  </dl>
                </article>
              </div>

              <div className="table-shell">
                <table>
                  <thead>
                    <tr>
                      <th>Detalle</th>
                      <th>Código</th>
                      <th>Cantidad</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPayslip.detail_lines.map((line) => (
                      <tr key={`${line.code}-${line.label}`}>
                        <td>{line.label}</td>
                        <td>{line.code}</td>
                        <td>{formatNumber(line.quantity)}</td>
                        <td>{formatCurrency(line.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <article className="surface-card section-space">
                <h3>Trazabilidad del cálculo</h3>
                <ul className="mini-list">
                  {selectedCalculation?.traces?.map((trace) => (
                    <li key={trace}>{trace}</li>
                  ))}
                </ul>
              </article>
            </>
          ) : (
            <div className="empty-state">
              <p>Primero liquida una quincena para ver el detalle y la tirilla.</p>
            </div>
          )}
        </section>
      </div>
    );
  }

  function renderExportsSection() {
    return (
      <div className="dashboard-grid">
        <section className="panel panel-import">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Filtros</p>
              <h2>Exportación corporativa a Excel y PDF</h2>
            </div>
            <div className="button-row">
              <button className="button ghost" onClick={() => handleExportDataset("pdf")}>
                Exportar PDF
              </button>
              <button className="button primary" onClick={() => handleExportDataset("excel")}>
                Exportar Excel
              </button>
              <button className="button ghost" onClick={handleSyncLegacy}>
                Sincronizar Excel legado
              </button>
              <button className="button ghost" onClick={handleResetModule}>
                Restablecer base
              </button>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Empleado
              <select
                value={exportFilters.employee_id}
                onChange={(event) =>
                  setExportFilters((current) => ({
                    ...current,
                    employee_id: event.target.value,
                  }))
                }
              >
                <option value="">Todos</option>
                {allEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.nombre_completo}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Cargo
              <select
                value={exportFilters.cargo}
                onChange={(event) =>
                  setExportFilters((current) => ({ ...current, cargo: event.target.value }))
                }
              >
                <option value="">Todos</option>
                {cargoOptions.map((cargo) => (
                  <option key={cargo} value={cargo}>
                    {cargo}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Estado
              <select
                value={exportFilters.status}
                onChange={(event) =>
                  setExportFilters((current) => ({ ...current, status: event.target.value }))
                }
              >
                <option value="">Todos</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </label>
            <label>
              Tipo
              <select
                value={exportFilters.tipo_empleado}
                onChange={(event) =>
                  setExportFilters((current) => ({
                    ...current,
                    tipo_empleado: event.target.value,
                  }))
                }
              >
                <option value="">Todos</option>
                {employeeTypeOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="span-full">
              Búsqueda libre
              <input
                type="search"
                value={exportFilters.search}
                onChange={(event) =>
                  setExportFilters((current) => ({ ...current, search: event.target.value }))
                }
                placeholder="Nombre, cargo o teléfono"
              />
            </label>
          </div>
        </section>

        <section className="panel panel-detail">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Vista previa</p>
              <h2>Dataset consolidado</h2>
            </div>
            <div className="chip-group">
              <span>{dataset.length} registros</span>
              <span>{selectedPeriod?.label || "Sin período"}</span>
            </div>
          </div>

          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Cargo</th>
                  <th>Días</th>
                  <th>Extras</th>
                  <th>Nocturno</th>
                  <th>Dominicales</th>
                  <th>Festivos</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {dataset.map((item) => (
                  <tr key={item.calculation.id}>
                    <td>{item.employee?.nombre_completo}</td>
                    <td>{item.employee?.cargo}</td>
                    <td>{formatNumber(item.attendance_summary.worked_days, 0)}</td>
                    <td>{formatNumber(item.calculation.extra_hours)}</td>
                    <td>{formatNumber(item.attendance_summary.night_hours)}</td>
                    <td>{formatNumber(item.attendance_summary.sunday_hours)}</td>
                    <td>{formatNumber(item.attendance_summary.festive_hours)}</td>
                    <td>{formatCurrency(item.calculation.total_pay)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel panel-list">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Historial</p>
              <h2>Exportaciones recientes</h2>
            </div>
          </div>
          <ul className="log-list">
            {exportHistory.map((entry) => (
              <li key={entry.id} className="log-item success">
                <strong>{entry.file_name}</strong>
                <span>
                  {entry.format.toUpperCase()} · {entry.scope} · {entry.generated_at}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

  function renderNotificationsSection() {
    return (
      <div className="dashboard-grid">
        <section className="panel panel-detail">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Mensajería</p>
              <h2>WhatsApp desacoplado</h2>
            </div>
            <label className="inline-select">
              <span>Proveedor</span>
              <select value={provider} onChange={(event) => setProvider(event.target.value)}>
                {WHATSAPP_PROVIDERS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="ops-grid">
            <article className="surface-card">
              <h3>Acciones rápidas</h3>
              {selectedEmployee ? (
                <ul className="mini-list">
                  <li>Empleado: {selectedEmployee.nombre_completo}</li>
                  <li>Teléfono: {selectedEmployee.telefono || "Sin teléfono"}</li>
                  <li>Período: {selectedPeriod?.label || "Sin período"}</li>
                </ul>
              ) : (
                <p className="muted">Selecciona un empleado para habilitar los envíos.</p>
              )}
              <div className="button-row section-space">
                <button className="button primary" onClick={handleSendPayslip}>
                  Enviar tirilla
                </button>
                <button className="button ghost" onClick={handleSendPayslip}>
                  Reenviar tirilla
                </button>
                <button className="button ghost" onClick={handleSendSchedule}>
                  Enviar horario
                </button>
                <button className="button ghost" onClick={handleSendSchedule}>
                  Reenviar horario
                </button>
              </div>
            </article>

            <article className="surface-card">
              <h3>Auditoría reciente</h3>
              <ul className="log-list">
                {auditLogs.map((entry) => (
                  <li key={entry.id} className="log-item">
                    <strong>{entry.action.replaceAll("_", " ")}</strong>
                    <span>{entry.executed_by} · {entry.executed_at}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="panel panel-export">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Historial</p>
              <h2>Estado de envíos</h2>
            </div>
          </div>

          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Empleado</th>
                  <th>Teléfono</th>
                  <th>Proveedor</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notification) => (
                  <tr key={notification.id}>
                    <td>{notification.type}</td>
                    <td>{getEmployeeById(database, notification.employee_id)?.nombre_completo || "Sin empleado"}</td>
                    <td>{notification.phone}</td>
                    <td>{notification.provider}</td>
                    <td>
                      <span className={`status-pill ${notification.status}`}>
                        {notification.status}
                      </span>
                    </td>
                    <td>{notification.sent_at || "Pendiente"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  return (
    <section className="workforce-shell">
      <header className="panel workforce-summary">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Gestión laboral ampliada</p>
            <h2>Módulo de personal, turnos, liquidación y notificaciones</h2>
            <p className="hero-text">
              Arquitectura modular con empleados, reglas parametrizadas, horarios, novedades,
              liquidación quincenal, exportaciones y base lista para integrar WhatsApp real.
            </p>
          </div>
          <div className="chip-group">
            <span>{userContext.role.label}</span>
            <span>{formatNumber(stats.total_employees, 0)} empleados</span>
            <span>{formatCurrency(stats.total_period_pay)} período actual</span>
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat-card accent">
            <span className="stat-label">Activos</span>
            <strong>{formatNumber(stats.active_employees, 0)}</strong>
            <small>Personal disponible para liquidación</small>
          </div>
          <div className="stat-card">
            <span className="stat-label">Inactivos</span>
            <strong>{formatNumber(stats.inactive_employees, 0)}</strong>
            <small>Incluye vacantes y retiros</small>
          </div>
          <div className="stat-card">
            <span className="stat-label">Notificaciones</span>
            <strong>{formatNumber(stats.total_notifications, 0)}</strong>
            <small>{formatNumber(stats.pending_notifications, 0)} pendientes</small>
          </div>
          <div className="stat-card">
            <span className="stat-label">Exportaciones</span>
            <strong>{formatNumber(stats.total_exports, 0)}</strong>
            <small>Histórico local y auditable</small>
          </div>
        </div>

        <nav className="subtab-row" aria-label="Navegación módulo laboral">
          {SECTION_OPTIONS.map((section) => (
            <button
              key={section.id}
              className={`subtab-button ${section.id === activeSection ? "active" : ""}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </header>

      {activeSection === "employees" ? renderEmployeesSection() : null}
      {activeSection === "schedules" ? renderSchedulesSection() : null}
      {activeSection === "payroll" ? renderPayrollSection() : null}
      {activeSection === "exports" ? renderExportsSection() : null}
      {activeSection === "notifications" ? renderNotificationsSection() : null}
    </section>
  );
}

export default WorkforceModule;
