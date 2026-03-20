import { useEffect, useState } from "react";
import readXlsxFile from "read-excel-file/browser";
import "./App.css";
import {
  CURRENT_TIME,
  DAY_LABELS,
  LOGIN_ACCOUNTS,
  MANUAL_OVERTIME_TYPES,
  NAV_ITEMS,
  SHIFT_LIBRARY,
  TODAY,
  createEmployeeDraft,
  deleteManualOvertimeEntry,
  deleteSpecialSchedule,
  deleteEmployee,
  getAccountByCredentials,
  getAttendanceState,
  getCurrentOperationsStats,
  getExcelRows,
  getManualOvertimeEntriesForDate,
  getManualOvertimeSummaryForDate,
  getPayrollDashboard,
  getPayrollFiltersOptions,
  getRegularShiftBlocksForDate,
  getScheduleWeekView,
  getSpecialSchedule,
  loadAccountData,
  saveAccountData,
  setUploadedExcelRows,
  upsertAttendance,
  upsertManualOvertime,
  upsertEmployee,
  upsertSpecialSchedule,
} from "./lib/dashboardData";

const STORAGE_KEYS = {
  session: "kaiko.dashboard.session",
};

const BRAND_NAME = "KAIKO";

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatNumber(value, digits = 1) {
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number(value || 0));
}

function createManualOvertimeDraft(employeeId = "", date = TODAY) {
  return {
    id: "",
    employeeId,
    date,
    overtimeType: "extra_diurna",
    hours: "",
    notes: "",
  };
}

function createSpecialScheduleDraft(employeeId = "", date = TODAY, blocks = [], notes = "", mode = "") {
  const [firstBlock = {}, secondBlock = {}] = blocks;

  return {
    employeeId,
    date,
    mode: mode || (blocks.length ? "custom" : "rest"),
    start1: firstBlock.start || "",
    end1: firstBlock.end || "",
    start2: secondBlock.start || "",
    end2: secondBlock.end || "",
    notes,
  };
}

function loadSession() {
  if (typeof window === "undefined") {
    return {
      isAuthenticated: false,
      email: "",
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.session);
    return raw
      ? JSON.parse(raw)
      : {
          isAuthenticated: false,
          email: "",
        };
  } catch {
    return {
      isAuthenticated: false,
      email: "",
    };
  }
}

function saveSession(session) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
}

function getRowsFromSheet(sheetRows) {
  const [rawHeaders = [], ...bodyRows] = sheetRows;

  return bodyRows
    .filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""))
    .map((row) =>
      Object.fromEntries(
        rawHeaders.map((header, index) => [String(header || `col_${index + 1}`), row[index] ?? ""]),
      ),
    );
}

function MetricCard({ label, value, detail, tone = "violet" }) {
  return (
    <article className={`metric-card ${tone}`}>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function StatusBadge({ status, label }) {
  return <span className={`status-badge ${status}`}>{label}</span>;
}

function ChartCard({ title, subtitle, data, formatter, tone = "violet" }) {
  const max = Math.max(...data.map((item) => Number(item.value || 0)), 1);

  return (
    <article className="chart-card">
      <div className="card-heading">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="chart-bars">
        {data.length ? (
          data.slice(0, 8).map((item) => (
            <div className="chart-row" key={item.id}>
              <span>{item.label}</span>
              <div className="chart-track">
                <div
                  className={`chart-fill ${tone}`}
                  style={{ width: `${Math.max(6, (Number(item.value || 0) / max) * 100)}%` }}
                />
              </div>
              <strong>{formatter(item.value)}</strong>
            </div>
          ))
        ) : (
          <div className="empty-card">
            <p>No hay datos disponibles.</p>
          </div>
        )}
      </div>
    </article>
  );
}

function ScheduleCell({ employee, day, data, onSelect, isActive }) {
  const state = getAttendanceState(employee, day.date, data);
  const overtimeSummary = getManualOvertimeSummaryForDate(data, employee, day.date);
  const shiftLabel =
    state.shiftBlocks.length > 0
      ? state.shiftBlocks.map((block) => `${block.start} - ${block.end}`).join(" · ")
      : "Descanso";

  return (
    <button className={`schedule-cell ${state.status} ${isActive ? "active" : ""}`} onClick={onSelect}>
      <span className="schedule-hours">{shiftLabel}</span>
      <div className="schedule-flags">
        {state.hasSpecialSchedule ? <span className="schedule-flag">Horario especial</span> : null}
        {overtimeSummary.hours > 0 ? (
          <span className="schedule-flag strong">HE manual {formatNumber(overtimeSummary.hours)} h</span>
        ) : null}
      </div>
      <StatusBadge status={state.status} label={state.label} />
    </button>
  );
}

function createEmptyDataForSession(nextSession) {
  return nextSession?.isAuthenticated && nextSession.email
      ? loadAccountData(nextSession.email)
      : {
          employees: [],
          attendance: [],
          payrollRecords: [],
          excelRows: [],
          uploadedExcelRows: [],
          manualOvertimeEntries: [],
          specialSchedules: [],
        };
}

function DashboardView({ payrollView, operations, onChangeView }) {
  return (
    <section className="module-shell">
      <div className="section-grid">
        <MetricCard
          label="Gasto total en horas extras"
          value={formatCurrency(payrollView.summary.overtimeSpend)}
          detail="Corte según filtros actuales"
        />
        <MetricCard
          label="Horas extras totales"
          value={formatNumber(payrollView.summary.overtimeHours)}
          detail="Acumulado consolidado"
          tone="magenta"
        />
        <MetricCard
          label="Horas perdidas"
          value={formatNumber(payrollView.summary.lostHours)}
          detail="Faltas y atrasos"
          tone="lilac"
        />
        <MetricCard
          label="Empleados trabajando"
          value={formatNumber(operations.workingNow, 0)}
          detail="Estado operativo actual"
          tone="slate"
        />
      </div>

      <div className="content-grid">
        <ChartCard
          title="Horas extras por mes"
          subtitle="Vista ejecutiva del comportamiento mensual"
          data={payrollView.charts.overtimeByMonth}
          formatter={(value) => formatNumber(value)}
          tone="violet"
        />
        <ChartCard
          title="Resultado final por mes"
          subtitle="Salarios, recargo nocturno y horas extras"
          data={payrollView.charts.finalByMonth}
          formatter={(value) => formatCurrency(value)}
          tone="magenta"
        />
      </div>

      <div className="content-grid narrow">
        <article className="panel-card">
          <div className="card-heading">
            <div>
              <h3>Estado operativo</h3>
              <p>Lectura inmediata del día.</p>
            </div>
            <button className="soft-button" onClick={() => onChangeView("schedule")}>
              Ir a horario
            </button>
          </div>
          <ul className="stat-list">
            <li>
              <span>Faltas justificadas</span>
              <strong>{formatNumber(operations.justifiedAbsences, 0)}</strong>
            </li>
            <li>
              <span>Faltas no justificadas</span>
              <strong>{formatNumber(operations.unjustifiedAbsences, 0)}</strong>
            </li>
            <li>
              <span>Atrasos en horas</span>
              <strong>{formatNumber(operations.lateHours)}</strong>
            </li>
          </ul>
        </article>

        <ChartCard
          title="Empleados por cargo"
          subtitle="Composición actual de la operación"
          data={payrollView.charts.employeesByPosition}
          formatter={(value) => formatNumber(value, 0)}
          tone="slate"
        />
      </div>
    </section>
  );
}

function EmployeesView({
  employees,
  selectedEmployee,
  employeeForm,
  setEmployeeForm,
  onSelectEmployee,
  onSaveEmployee,
  onDeleteEmployee,
  onResetEmployee,
}) {
  return (
    <section className="module-shell">
      <div className="content-grid">
        <article className="panel-card">
          <div className="card-heading">
            <div>
              <h3>Equipo registrado</h3>
              <p>Admisión, cargo, salario y valor por hora.</p>
            </div>
            <button className="soft-button" onClick={onResetEmployee}>
              Nuevo empleado
            </button>
          </div>

          <div className="employee-stack">
            {employees.length ? (
              employees.map((employee) => (
                <button
                  key={employee.id}
                  className={`employee-row ${selectedEmployee?.id === employee.id ? "active" : ""}`}
                  onClick={() => onSelectEmployee(employee)}
                >
                  <div>
                    <strong>{employee.name}</strong>
                    <span>{employee.position}</span>
                  </div>
                  <div>
                    <strong>{formatCurrency(employee.salaryBase)}</strong>
                    <span>{formatNumber(employee.hourlyValue, 0)} / h</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="empty-card">
                <p>Esta cuenta no tiene empleados cargados todavía.</p>
              </div>
            )}
          </div>
        </article>

        <article className="panel-card">
          <div className="card-heading">
            <div>
              <h3>{employeeForm.id ? "Editar empleado" : "Crear empleado"}</h3>
              <p>Completa la ficha básica del trabajador.</p>
            </div>
          </div>

          <form className="form-layout" onSubmit={onSaveEmployee}>
            <div className="form-grid">
              <label>
                Fecha de admisión
                <input
                  type="date"
                  value={employeeForm.admissionDate}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({
                      ...current,
                      admissionDate: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Nombre
                <input
                  value={employeeForm.name}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </label>
              <label>
                Cargo
                <input
                  value={employeeForm.position}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({ ...current, position: event.target.value }))
                  }
                />
              </label>
              <label>
                Salario base
                <input
                  type="number"
                  min="0"
                  value={employeeForm.salaryBase}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({
                      ...current,
                      salaryBase: Number(event.target.value) || 0,
                    }))
                  }
                />
              </label>
              <label>
                Carga horaria semanal
                <input
                  type="number"
                  min="1"
                  value={employeeForm.weeklyHours}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({
                      ...current,
                      weeklyHours: Number(event.target.value) || 0,
                    }))
                  }
                />
              </label>
              <label>
                Valor por hora
                <input
                  type="number"
                  min="0"
                  value={employeeForm.hourlyValue}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({
                      ...current,
                      hourlyValue: Number(event.target.value) || 0,
                    }))
                  }
                />
              </label>
              <label>
                Día de descanso
                <select
                  value={employeeForm.restDay}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({ ...current, restDay: event.target.value }))
                  }
                >
                  {Object.entries(DAY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tipo de turno
                <select
                  value={employeeForm.shiftId}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({ ...current, shiftId: event.target.value }))
                  }
                >
                  {Object.entries(SHIFT_LIBRARY).map(([key, shift]) => (
                    <option key={key} value={key}>
                      {shift.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Estado
                <select
                  value={employeeForm.status}
                  onChange={(event) =>
                    setEmployeeForm((current) => ({ ...current, status: event.target.value }))
                  }
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Vacante">Vacante</option>
                </select>
              </label>
            </div>

            <div className="button-group">
              <button className="primary-button" type="submit">
                Guardar empleado
              </button>
              <button className="soft-button" type="button" onClick={onResetEmployee}>
                Limpiar
              </button>
              <button className="soft-button danger" type="button" onClick={onDeleteEmployee}>
                Eliminar
              </button>
            </div>
          </form>
        </article>
      </div>
    </section>
  );
}

function ScheduleView({
  data,
  employees,
  scheduleView,
  selectedDetail,
  attendanceForm,
  setAttendanceForm,
  manualOvertimeForm,
  setManualOvertimeForm,
  specialScheduleForm,
  setSpecialScheduleForm,
  onSelectControl,
  onSaveAttendance,
  onQuickClockIn,
  onSaveManualOvertime,
  onEditManualOvertime,
  onDeleteManualOvertime,
  onSaveSpecialSchedule,
  onClearSpecialSchedule,
}) {
  const detailEmployee =
    employees.find((employee) => employee.id === selectedDetail.employeeId) || null;
  const detailState =
    detailEmployee && selectedDetail.date
      ? getAttendanceState(detailEmployee, selectedDetail.date, data)
      : null;
  const detailManualEntries =
    detailEmployee && selectedDetail.date
      ? getManualOvertimeEntriesForDate(data, detailEmployee.id, selectedDetail.date)
      : [];
  const detailManualSummary =
    detailEmployee && selectedDetail.date
      ? getManualOvertimeSummaryForDate(data, detailEmployee, selectedDetail.date)
      : { hours: 0, value: 0 };
  const detailSpecialSchedule =
    detailEmployee && selectedDetail.date
      ? getSpecialSchedule(data, detailEmployee.id, selectedDetail.date)
      : null;

  return (
    <section className="module-shell">
      <article className="panel-card">
          <div className="card-heading">
            <div>
              <h3>Horario empresarial semanal</h3>
              <p>Haz clic sobre cualquier día para expandir su control dentro de esta misma vista.</p>
            </div>
          </div>

          <div className="schedule-grid">
            <div className="schedule-grid-header sticky-left">Empleado</div>
            {scheduleView.days.map((day) => (
              <div key={day.date} className="schedule-grid-header">
                {DAY_LABELS[day.key]}<small>{day.date.slice(8, 10)}</small>
              </div>
            ))}

            {scheduleView.rows.map((row) => (
              <div className="schedule-grid-row" key={row.employee.id}>
                <div className="schedule-employee sticky-left">
                  <strong>{row.employee.name}</strong>
                  <span>{row.employee.position}</span>
                </div>
                {row.days.map((day) => (
                  <ScheduleCell
                    key={`${row.employee.id}-${day.date}`}
                    employee={row.employee}
                    day={day}
                    data={data}
                    isActive={
                      selectedDetail.employeeId === row.employee.id &&
                      selectedDetail.date === day.date
                    }
                    onSelect={() => onSelectControl(row.employee, day.date)}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="schedule-detail-shell">
            {detailEmployee && selectedDetail.date ? (
              <>
                <div className="schedule-detail-summary">
                  <div>
                    <span className="metric-label">Empleado seleccionado</span>
                    <strong>{detailEmployee.name}</strong>
                    <small>
                      {detailEmployee.position} · {selectedDetail.date}
                    </small>
                  </div>
                  <div>
                    <span className="metric-label">Programación del día</span>
                    <strong>
                      {detailState?.shiftBlocks?.length
                        ? detailState.shiftBlocks.map((block) => `${block.start} - ${block.end}`).join(" · ")
                        : "Descanso"}
                    </strong>
                    <small>
                      {detailSpecialSchedule ? "Agenda especial activa" : "Agenda base del turno"}
                    </small>
                  </div>
                  <div>
                    <span className="metric-label">Horas extra manuales</span>
                    <strong>{formatNumber(detailManualSummary.hours)} h</strong>
                    <small>{formatCurrency(detailManualSummary.value)}</small>
                  </div>
                  <div className="summary-badge-stack">
                    {detailState ? <StatusBadge status={detailState.status} label={detailState.label} /> : null}
                    {detailSpecialSchedule ? <span className="inline-notice">Horario especial</span> : null}
                  </div>
                </div>
              <div className="schedule-detail-card">
                <div className="card-heading compact">
                  <div>
                    <h3>Control del día seleccionado</h3>
                    <p>
                      {detailEmployee.name} · {detailEmployee.position} · {selectedDetail.date}
                    </p>
                  </div>
                  {detailState ? (
                    <StatusBadge status={detailState.status} label={detailState.label} />
                  ) : null}
                </div>

                <form className="form-layout" onSubmit={onSaveAttendance}>
                  <div className="form-grid">
                    <label>
                      Empleado
                      <input value={detailEmployee.name} readOnly />
                    </label>
                    <label>
                      Fecha
                      <input type="date" value={attendanceForm.date} readOnly />
                    </label>
                    <label>
                      Hora de ingreso
                      <input
                        type="time"
                        value={attendanceForm.clockIn}
                        onChange={(event) =>
                          setAttendanceForm((current) => ({
                            ...current,
                            clockIn: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Tipo de falta
                      <select
                        value={attendanceForm.absenceType}
                        onChange={(event) =>
                          setAttendanceForm((current) => ({
                            ...current,
                            absenceType: event.target.value,
                          }))
                        }
                      >
                        <option value="">Sin falta</option>
                        <option value="justificada">Falta justificada</option>
                        <option value="no_justificada">Falta no justificada</option>
                      </select>
                    </label>
                  </div>

                  <label>
                    Observación
                    <textarea
                      rows="4"
                      value={attendanceForm.notes}
                      onChange={(event) =>
                        setAttendanceForm((current) => ({ ...current, notes: event.target.value }))
                      }
                    />
                  </label>

                  <div className="button-group">
                    <button className="primary-button" type="submit">
                      Guardar control
                    </button>
                    <button className="soft-button" type="button" onClick={onQuickClockIn}>
                      Marcar ingreso ahora
                    </button>
                  </div>
                </form>
              </div>
              <div className="schedule-detail-grid">
                <div className="schedule-detail-card">
                  <div className="card-heading compact">
                    <div>
                      <h3>Horas extra manuales</h3>
                      <p>Registra ajustes puntuales para este empleado y esta fecha.</p>
                    </div>
                  </div>

                  <form className="form-layout" onSubmit={onSaveManualOvertime}>
                    <div className="form-grid">
                      <label>
                        Tipo
                        <select
                          value={manualOvertimeForm.overtimeType}
                          onChange={(event) =>
                            setManualOvertimeForm((current) => ({
                              ...current,
                              overtimeType: event.target.value,
                            }))
                          }
                        >
                          {Object.entries(MANUAL_OVERTIME_TYPES).map(([key, item]) => (
                            <option key={key} value={key}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Horas
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={manualOvertimeForm.hours}
                          onChange={(event) =>
                            setManualOvertimeForm((current) => ({
                              ...current,
                              hours: event.target.value,
                            }))
                          }
                        />
                      </label>
                    </div>

                    <label>
                      Observación
                      <textarea
                        rows="3"
                        value={manualOvertimeForm.notes}
                        onChange={(event) =>
                          setManualOvertimeForm((current) => ({ ...current, notes: event.target.value }))
                        }
                      />
                    </label>

                    <div className="button-group">
                      <button className="primary-button" type="submit">
                        Guardar horas extra
                      </button>
                      {manualOvertimeForm.id ? (
                        <button className="soft-button danger" type="button" onClick={onDeleteManualOvertime}>
                          Eliminar registro
                        </button>
                      ) : null}
                    </div>
                  </form>

                  <div className="stack-list compact">
                    {detailManualEntries.length ? (
                      detailManualEntries.map((entry) => (
                        <button
                          key={entry.id}
                          className={`stack-row ${manualOvertimeForm.id === entry.id ? "active" : ""}`}
                          type="button"
                          onClick={() => onEditManualOvertime(entry)}
                        >
                          <div>
                            <strong>
                              {MANUAL_OVERTIME_TYPES[entry.overtimeType]?.label || "Horas extra"}
                            </strong>
                            <span>{entry.notes || "Sin observación."}</span>
                          </div>
                          <div>
                            <strong>{formatNumber(entry.hours)} h</strong>
                            <span>
                              {formatCurrency(
                                detailEmployee.hourlyValue *
                                  entry.hours *
                                  (MANUAL_OVERTIME_TYPES[entry.overtimeType]?.multiplier || 1),
                              )}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="empty-card mini">
                        <p>No hay horas extra manuales cargadas para esta fecha.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="schedule-detail-card">
                  <div className="card-heading compact">
                    <div>
                      <h3>Horario especial</h3>
                      <p>Crea una agenda excepcional para este día dentro del calendario.</p>
                    </div>
                  </div>

                  <form className="form-layout" onSubmit={onSaveSpecialSchedule}>
                    <label>
                      Tipo de agenda
                      <select
                        value={specialScheduleForm.mode}
                        onChange={(event) =>
                          setSpecialScheduleForm((current) => ({
                            ...current,
                            mode: event.target.value,
                          }))
                        }
                      >
                        <option value="custom">Horario especial</option>
                        <option value="rest">Descanso especial</option>
                      </select>
                    </label>

                    {specialScheduleForm.mode === "custom" ? (
                      <div className="form-grid">
                        <label>
                          Inicio bloque 1
                          <input
                            type="time"
                            value={specialScheduleForm.start1}
                            onChange={(event) =>
                              setSpecialScheduleForm((current) => ({
                                ...current,
                                start1: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label>
                          Fin bloque 1
                          <input
                            type="time"
                            value={specialScheduleForm.end1}
                            onChange={(event) =>
                              setSpecialScheduleForm((current) => ({
                                ...current,
                                end1: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label>
                          Inicio bloque 2
                          <input
                            type="time"
                            value={specialScheduleForm.start2}
                            onChange={(event) =>
                              setSpecialScheduleForm((current) => ({
                                ...current,
                                start2: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label>
                          Fin bloque 2
                          <input
                            type="time"
                            value={specialScheduleForm.end2}
                            onChange={(event) =>
                              setSpecialScheduleForm((current) => ({
                                ...current,
                                end2: event.target.value,
                              }))
                            }
                          />
                        </label>
                      </div>
                    ) : (
                      <span className="inline-notice">La fecha quedará marcada como descanso especial.</span>
                    )}

                    <label>
                      Observación
                      <textarea
                        rows="3"
                        value={specialScheduleForm.notes}
                        onChange={(event) =>
                          setSpecialScheduleForm((current) => ({
                            ...current,
                            notes: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <div className="button-group">
                      <button className="primary-button" type="submit">
                        Guardar horario especial
                      </button>
                      {detailSpecialSchedule ? (
                        <button className="soft-button" type="button" onClick={onClearSpecialSchedule}>
                          Volver a agenda base
                        </button>
                      ) : null}
                    </div>
                  </form>
                </div>
              </div>
              </>
            ) : (
              <div className="empty-card">
                <p>Selecciona un día del horario para expandir su detalle y controlarlo aquí.</p>
              </div>
            )}
          </div>
      </article>
    </section>
  );
}

function PayrollView({
  payrollView,
  filtersOptions,
  payrollFilters,
  setPayrollFilters,
  chartMode,
  setChartMode,
  excelRows,
  excelFileName,
  onUploadExcel,
  accountMode,
}) {
  return (
    <section className="module-shell">
      <div className="section-grid">
        <MetricCard
          label="Gasto total en horas extras"
          value={formatCurrency(payrollView.summary.overtimeSpend)}
          detail="Filtrado por año, mes, empleado o cargo"
        />
        <MetricCard
          label="Horas previstas"
          value={formatNumber(payrollView.summary.plannedHours)}
          detail="Carga horaria proyectada"
          tone="magenta"
        />
        <MetricCard
          label="Horas trabajadas"
          value={formatNumber(payrollView.summary.workedHours)}
          detail="Ejecución real"
          tone="lilac"
        />
        <MetricCard
          label="Cálculo final"
          value={formatCurrency(payrollView.summary.finalTotal)}
          detail="Salarios + recargo nocturno + horas extra"
          tone="slate"
        />
      </div>

      <article className="panel-card">
        <div className="card-heading">
          <div>
            <h3>Filtros de análisis</h3>
            <p>Agrupa la vista por año, mes, empleado o cargo.</p>
          </div>
        </div>

        <div className="form-grid">
          <label>
            Año
            <select
              value={payrollFilters.year}
              onChange={(event) =>
                setPayrollFilters((current) => ({ ...current, year: event.target.value }))
              }
            >
              <option value="">Todos</option>
              {filtersOptions.years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label>
            Mes
            <select
              value={payrollFilters.monthKey}
              onChange={(event) =>
                setPayrollFilters((current) => ({ ...current, monthKey: event.target.value }))
              }
            >
              <option value="">Todos</option>
              {filtersOptions.months.map((month) => (
                <option key={month.key} value={month.key}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Empleado
            <select
              value={payrollFilters.employeeId}
              onChange={(event) =>
                setPayrollFilters((current) => ({
                  ...current,
                  employeeId: event.target.value,
                }))
              }
            >
              <option value="">Todos</option>
              {filtersOptions.employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cargo
            <select
              value={payrollFilters.position}
              onChange={(event) =>
                setPayrollFilters((current) => ({ ...current, position: event.target.value }))
              }
            >
              <option value="">Todos</option>
              {filtersOptions.positions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </label>
        </div>
      </article>

      <div className="content-grid">
        <article className="panel-card">
          <div className="card-heading">
            <div>
              <h3>Horas extras por mes</h3>
              <p>Conmutador entre horas y gasto.</p>
            </div>
            <div className="segmented-control">
              <button
                className={chartMode === "hours" ? "active" : ""}
                onClick={() => setChartMode("hours")}
              >
                Horas
              </button>
              <button
                className={chartMode === "spend" ? "active" : ""}
                onClick={() => setChartMode("spend")}
              >
                Gasto
              </button>
            </div>
          </div>
          <div className="chart-bars">
            {(chartMode === "hours" ? payrollView.charts.overtimeByMonth : payrollView.charts.spendByMonth).map(
              (item) => {
                const dataSet =
                  chartMode === "hours"
                    ? payrollView.charts.overtimeByMonth
                    : payrollView.charts.spendByMonth;
                const max = Math.max(...dataSet.map((entry) => Number(entry.value || 0)), 1);

                return (
                  <div className="chart-row" key={item.id}>
                    <span>{item.label}</span>
                    <div className="chart-track">
                      <div
                        className={`chart-fill ${chartMode === "hours" ? "violet" : "magenta"}`}
                        style={{ width: `${Math.max(6, (Number(item.value || 0) / max) * 100)}%` }}
                      />
                    </div>
                    <strong>
                      {chartMode === "hours"
                        ? formatNumber(item.value)
                        : formatCurrency(item.value)}
                    </strong>
                  </div>
                );
              },
            )}
          </div>
        </article>

        <ChartCard
          title="Horas extras por cargo"
          subtitle="Comparativo por rol"
          data={payrollView.charts.overtimeByPosition}
          formatter={(value) => formatNumber(value)}
          tone="lilac"
        />
      </div>

      <div className="content-grid">
        <ChartCard
          title="Horas extras por turno"
          subtitle="Carga por tipo de jornada"
          data={payrollView.charts.overtimeByShift}
          formatter={(value) => formatNumber(value)}
          tone="slate"
        />
        <ChartCard
          title="Horas extras por empleado"
          subtitle="Ranking individual"
          data={payrollView.charts.overtimeByEmployee}
          formatter={(value) => formatNumber(value)}
          tone="violet"
        />
      </div>

      <div className="content-grid">
        <ChartCard
          title="Cantidad de empleados por cargo"
          subtitle="Distribución interna"
          data={payrollView.charts.employeesByPosition}
          formatter={(value) => formatNumber(value, 0)}
          tone="magenta"
        />
        <ChartCard
          title="Gasto final con horas extra por mes"
          subtitle="Costo extraordinario mensual"
          data={payrollView.charts.finalExpenseByMonth}
          formatter={(value) => formatCurrency(value)}
          tone="slate"
        />
      </div>

      <article className="panel-card">
        <div className="card-heading">
          <div>
            <h3>Visualización de Excel</h3>
            <p>
              {accountMode === "demo"
                ? "La cuenta demo incluye un Excel de demostración y también permite cargar otro archivo."
                : "Carga un Excel para ver su detalle dentro del dashboard."}
            </p>
          </div>
          <label className="upload-button">
            Cargar Excel
            <input type="file" accept=".xlsx" onChange={onUploadExcel} />
          </label>
        </div>

        <p className="muted-line">
          Archivo actual: <strong>{excelFileName}</strong>
        </p>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {Object.keys(excelRows[0] || {}).map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {excelRows.length ? (
                excelRows.map((row, index) => (
                  <tr key={`excel-${index}`}>
                    {Object.keys(excelRows[0]).map((header) => (
                      <td key={`${header}-${index}`}>{String(row[header] ?? "")}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9">
                    <div className="empty-card">
                      <p>No hay archivo cargado en esta cuenta.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function App() {
  const [session, setSession] = useState(() => loadSession());
  const [data, setData] = useState(() => createEmptyDataForSession(loadSession()));
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [activeView, setActiveView] = useState("dashboard");
  const [notice, setNotice] = useState("");
  const [employeeForm, setEmployeeForm] = useState(() => createEmployeeDraft());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [attendanceForm, setAttendanceForm] = useState({
    employeeId: "",
    date: TODAY,
    clockIn: CURRENT_TIME,
    absenceType: "",
    notes: "",
  });
  const [manualOvertimeForm, setManualOvertimeForm] = useState(() => createManualOvertimeDraft());
  const [specialScheduleForm, setSpecialScheduleForm] = useState(() => createSpecialScheduleDraft());
  const [selectedScheduleDetail, setSelectedScheduleDetail] = useState({
    employeeId: "",
    date: "",
  });
  const [payrollFilters, setPayrollFilters] = useState({
    year: "2026",
    monthKey: "",
    employeeId: "",
    position: "",
  });
  const [chartMode, setChartMode] = useState("hours");
  const [excelFileName, setExcelFileName] = useState("demo-nomina.xlsx");

  useEffect(() => {
    saveSession(session);
  }, [session]);

  useEffect(() => {
    if (session.isAuthenticated && session.email) {
      saveAccountData(session.email, data);
    }
  }, [data, session]);

  const account = LOGIN_ACCOUNTS.find((item) => item.email === session.email) || null;
  const employees = data.employees;
  const selectedEmployee =
    employees.find((employee) => employee.id === selectedEmployeeId) || employees[0] || null;
  const scheduleView = getScheduleWeekView(data);
  const operations = getCurrentOperationsStats(data);
  const filtersOptions = {
    ...getPayrollFiltersOptions(data),
    employees: employees.filter((employee) => employee.status !== "Vacante"),
  };
  const payrollView = getPayrollDashboard(data, payrollFilters);
  const excelRows = getExcelRows(data);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  }

  function handleLogin(event) {
    event.preventDefault();
    const accountMatch = getAccountByCredentials(loginForm.email, loginForm.password);

    if (!accountMatch) {
      setLoginError("Credenciales inválidas.");
      return;
    }

    setSession({
      isAuthenticated: true,
      email: accountMatch.email,
    });
    setData(loadAccountData(accountMatch.email));
    setExcelFileName(accountMatch.mode === "demo" ? "demo-nomina.xlsx" : "sin-archivo");
    setLoginError("");
    setNotice("");
    setActiveView("dashboard");
    setEmployeeForm(createEmployeeDraft());
    setSelectedEmployeeId("");
    setAttendanceForm({
      employeeId: "",
      date: TODAY,
      clockIn: CURRENT_TIME,
      absenceType: "",
      notes: "",
    });
    setManualOvertimeForm(createManualOvertimeDraft());
    setSpecialScheduleForm(createSpecialScheduleDraft());
    setSelectedScheduleDetail({
      employeeId: "",
      date: "",
    });
  }

  function handleLogout() {
    setSession({ isAuthenticated: false, email: "" });
    setData(createEmptyDataForSession(null));
    setLoginForm({ email: "", password: "" });
    setSelectedEmployeeId("");
    setManualOvertimeForm(createManualOvertimeDraft());
    setSpecialScheduleForm(createSpecialScheduleDraft());
  }

  function handleSelectEmployee(employee) {
    setSelectedEmployeeId(employee.id);
    setEmployeeForm({
      id: employee.id,
      admissionDate: employee.admissionDate,
      name: employee.name,
      position: employee.position,
      salaryBase: employee.salaryBase,
      weeklyHours: employee.weeklyHours,
      hourlyValue: employee.hourlyValue,
      restDay: employee.restDay,
      shiftId: employee.shiftId,
      status: employee.status,
    });
  }

  function handleResetEmployee() {
    setEmployeeForm(createEmployeeDraft());
  }

  function handleSaveEmployee(event) {
    event.preventDefault();

    if (!employeeForm.name.trim() || !employeeForm.position.trim()) {
      setLoginError("");
      showNotice("Completa al menos nombre y cargo del empleado.");
      return;
    }

    const nextData = upsertEmployee(data, employeeForm);
    setData(nextData);
    showNotice("Empleado guardado correctamente.");
  }

  function handleDeleteEmployee() {
    if (!employeeForm.id) {
      showNotice("Selecciona un empleado existente para eliminar.");
      return;
    }

    setData(deleteEmployee(data, employeeForm.id));
    setEmployeeForm(createEmployeeDraft());
    setSelectedEmployeeId("");
    showNotice("Empleado eliminado del registro.");
  }

  function handleSelectAttendance(employee, date) {
    const record = data.attendance.find(
      (entry) => entry.employeeId === employee.id && entry.date === date,
    );
    const specialSchedule = getSpecialSchedule(data, employee.id, date);
    const baseBlocks = specialSchedule?.blocks || getRegularShiftBlocksForDate(employee, date);

    setSelectedScheduleDetail({
      employeeId: employee.id,
      date,
    });
    setAttendanceForm({
      employeeId: employee.id,
      date,
      clockIn: record?.clockIn || CURRENT_TIME,
      absenceType: record?.absenceType || "",
      notes: record?.notes || "",
    });
    setManualOvertimeForm(createManualOvertimeDraft(employee.id, date));
    setSpecialScheduleForm(
      createSpecialScheduleDraft(
        employee.id,
        date,
        baseBlocks,
        specialSchedule?.notes || "",
        specialSchedule?.mode || "",
      ),
    );
  }

  function handleSaveAttendance(event) {
    event.preventDefault();

    if (!attendanceForm.employeeId) {
      showNotice("Selecciona un empleado para guardar el control.");
      return;
    }

    const payload =
      attendanceForm.absenceType
        ? { ...attendanceForm, clockIn: "" }
        : attendanceForm;

    setData(upsertAttendance(data, payload));
    showNotice("Control de asistencia actualizado.");
  }

  function handleQuickClockIn() {
    if (!attendanceForm.employeeId) {
      showNotice("Selecciona un empleado antes de marcar ingreso.");
      return;
    }

    setAttendanceForm((current) => ({
      ...current,
      clockIn: CURRENT_TIME,
      absenceType: "",
    }));
    setData(
      upsertAttendance(data, {
        ...attendanceForm,
        clockIn: CURRENT_TIME,
        absenceType: "",
      }),
    );
    showNotice("Ingreso autorizado correctamente.");
  }

  function handleEditManualOvertime(entry) {
    setManualOvertimeForm({
      id: entry.id,
      employeeId: entry.employeeId,
      date: entry.date,
      overtimeType: entry.overtimeType,
      hours: String(entry.hours ?? ""),
      notes: entry.notes || "",
    });
  }

  function handleSaveManualOvertime(event) {
    event.preventDefault();

    if (!manualOvertimeForm.employeeId) {
      showNotice("Selecciona un empleado antes de registrar horas extra.");
      return;
    }

    if (Number(manualOvertimeForm.hours || 0) <= 0) {
      showNotice("Ingresa una cantidad de horas extra válida.");
      return;
    }

    const nextData = upsertManualOvertime(data, {
      ...manualOvertimeForm,
      hours: Number(manualOvertimeForm.hours),
    });

    setData(nextData);
    setManualOvertimeForm(createManualOvertimeDraft(manualOvertimeForm.employeeId, manualOvertimeForm.date));
    showNotice("Horas extra manuales guardadas.");
  }

  function handleDeleteManualOvertime() {
    if (!manualOvertimeForm.id) {
      showNotice("Selecciona un registro de horas extra para eliminar.");
      return;
    }

    setData(deleteManualOvertimeEntry(data, manualOvertimeForm.id));
    setManualOvertimeForm(createManualOvertimeDraft(manualOvertimeForm.employeeId, manualOvertimeForm.date));
    showNotice("Registro manual eliminado.");
  }

  function handleSaveSpecialSchedule(event) {
    event.preventDefault();

    if (!specialScheduleForm.employeeId) {
      showNotice("Selecciona un empleado antes de crear un horario especial.");
      return;
    }

    const blocks =
      specialScheduleForm.mode === "rest"
        ? []
        : [
            { start: specialScheduleForm.start1, end: specialScheduleForm.end1 },
            { start: specialScheduleForm.start2, end: specialScheduleForm.end2 },
          ].filter((block) => block.start && block.end && block.end > block.start);

    if (specialScheduleForm.mode === "custom" && !blocks.length) {
      showNotice("Configura al menos un bloque válido para el horario especial.");
      return;
    }

    const nextData = upsertSpecialSchedule(data, {
      employeeId: specialScheduleForm.employeeId,
      date: specialScheduleForm.date,
      mode: specialScheduleForm.mode,
      blocks,
      notes: specialScheduleForm.notes,
    });

    setData(nextData);
    showNotice("Horario especial guardado en la agenda.");
  }

  function handleClearSpecialSchedule() {
    if (!specialScheduleForm.employeeId || !specialScheduleForm.date) {
      showNotice("Selecciona una fecha antes de limpiar el horario especial.");
      return;
    }

    const employee = employees.find((item) => item.id === specialScheduleForm.employeeId);
    const baseBlocks = employee
      ? getRegularShiftBlocksForDate(employee, specialScheduleForm.date)
      : [];

    setData(deleteSpecialSchedule(data, specialScheduleForm.employeeId, specialScheduleForm.date));
    setSpecialScheduleForm(
      createSpecialScheduleDraft(
        specialScheduleForm.employeeId,
        specialScheduleForm.date,
        baseBlocks,
      ),
    );
    showNotice("La fecha volvió a la agenda base.");
  }

  async function handleUploadExcel(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const sheetRows = await readXlsxFile(file);
      const rows = getRowsFromSheet(sheetRows);
      setData(setUploadedExcelRows(data, rows));
      setExcelFileName(file.name);
      showNotice("Excel cargado correctamente.");
    } catch {
      showNotice("No fue posible leer el archivo Excel.");
    }

    event.target.value = "";
  }

  if (!session.isAuthenticated) {
    return (
      <div className="login-page">
        <section className="login-card">
          <div className="login-brand">
            <img src="/branding/logoIOS.png" alt={`Logo ${BRAND_NAME}`} className="login-logo" />
            <p className="eyebrow">Acceso corporativo</p>
            <h1>{BRAND_NAME}</h1>
            <p>
              Dashboard ejecutivo de empleados, horario y nómina. El acceso es obligatorio
              desde la primera vista del aplicativo.
            </p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <label>
              Correo electrónico
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, email: event.target.value }))
                }
                autoComplete="username"
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, password: event.target.value }))
                }
                autoComplete="current-password"
              />
            </label>
            {loginError ? <p className="form-error">{loginError}</p> : null}
            <button className="primary-button wide" type="submit">
              Ingresar
            </button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-stack">
          <div className="sidebar-brand">
            <img src="/branding/logoIOS.png" alt={`Logo ${BRAND_NAME}`} className="sidebar-logo" />
            <div>
              <p className="eyebrow">Plan software dashboard</p>
              <h1>{BRAND_NAME}</h1>
            </div>
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`sidebar-link ${activeView === item.id ? "active" : ""}`}
                onClick={() => setActiveView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <span className={`account-pill ${account?.mode || "admin"}`}>
              {account?.mode === "demo" ? "Entorno demo" : "Entorno admin"}
            </span>
            <small>{session.email}</small>
            <button className="soft-button wide" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operación interna</p>
            <h2>
              {activeView === "dashboard" ? "Resumen general" : NAV_ITEMS.find((item) => item.id === activeView)?.label}
            </h2>
          </div>
          <div className="topbar-actions">
            <span>{TODAY}</span>
            <span>{CURRENT_TIME}</span>
          </div>
        </header>

        {notice ? <div className="inline-notice">{notice}</div> : null}

        {activeView === "dashboard" ? (
          <DashboardView
            payrollView={payrollView}
            operations={operations}
            onChangeView={setActiveView}
          />
        ) : null}

        {activeView === "employees" ? (
          <EmployeesView
            employees={employees}
            selectedEmployee={selectedEmployee}
            employeeForm={employeeForm}
            setEmployeeForm={setEmployeeForm}
            onSelectEmployee={handleSelectEmployee}
            onSaveEmployee={handleSaveEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onResetEmployee={handleResetEmployee}
          />
        ) : null}

        {activeView === "schedule" ? (
          <ScheduleView
            data={data}
            employees={employees.filter((employee) => employee.status !== "Vacante")}
            scheduleView={scheduleView}
            selectedDetail={selectedScheduleDetail}
            attendanceForm={attendanceForm}
            setAttendanceForm={setAttendanceForm}
            manualOvertimeForm={manualOvertimeForm}
            setManualOvertimeForm={setManualOvertimeForm}
            specialScheduleForm={specialScheduleForm}
            setSpecialScheduleForm={setSpecialScheduleForm}
            onSelectControl={handleSelectAttendance}
            onSaveAttendance={handleSaveAttendance}
            onQuickClockIn={handleQuickClockIn}
            onSaveManualOvertime={handleSaveManualOvertime}
            onEditManualOvertime={handleEditManualOvertime}
            onDeleteManualOvertime={handleDeleteManualOvertime}
            onSaveSpecialSchedule={handleSaveSpecialSchedule}
            onClearSpecialSchedule={handleClearSpecialSchedule}
          />
        ) : null}

        {activeView === "payroll" ? (
          <PayrollView
            payrollView={payrollView}
            filtersOptions={filtersOptions}
            payrollFilters={payrollFilters}
            setPayrollFilters={setPayrollFilters}
            chartMode={chartMode}
            setChartMode={setChartMode}
            excelRows={excelRows}
            excelFileName={excelFileName}
            onUploadExcel={handleUploadExcel}
            accountMode={account?.mode}
          />
        ) : null}
      </main>
    </div>
  );
}

export default App;
