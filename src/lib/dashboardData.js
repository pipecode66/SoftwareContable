export const TODAY = "2026-03-20";
export const CURRENT_TIME = "10:30";

export const LOGIN_ACCOUNTS = [
  {
    email: "admin@sandeli.com",
    password: "sandeli12@",
    mode: "admin",
    label: "Administración",
  },
  {
    email: "demo@sandeli.com",
    password: "sandeli12@",
    mode: "demo",
    label: "Demostración",
  },
];

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "employees", label: "Empleados" },
  { id: "schedule", label: "Horario" },
  { id: "payroll", label: "Nómina" },
];

export const DAY_KEYS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

export const DAY_LABELS = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sáb",
  domingo: "Dom",
};

export const SHIFT_LIBRARY = {
  general: {
    label: "Operación completa",
    blocks: {
      lunes: [{ start: "08:00", end: "20:00" }],
      martes: [{ start: "08:00", end: "20:00" }],
      miercoles: [{ start: "08:00", end: "20:00" }],
      jueves: [{ start: "08:00", end: "20:00" }],
      viernes: [{ start: "08:00", end: "20:00" }],
      sabado: [{ start: "08:00", end: "20:00" }],
      domingo: [
        { start: "08:00", end: "12:00" },
        { start: "14:00", end: "19:00" },
      ],
    },
  },
  admin: {
    label: "Administrativo",
    blocks: {
      lunes: [{ start: "08:00", end: "18:00" }],
      martes: [{ start: "08:00", end: "18:00" }],
      miercoles: [{ start: "08:00", end: "18:00" }],
      jueves: [{ start: "08:00", end: "18:00" }],
      viernes: [{ start: "08:00", end: "18:00" }],
      sabado: [{ start: "08:00", end: "13:00" }],
      domingo: [],
    },
  },
  part_time_30: {
    label: "Turnero 30 horas",
    blocks: {
      lunes: [{ start: "10:00", end: "16:00" }],
      martes: [{ start: "10:00", end: "16:00" }],
      miercoles: [{ start: "10:00", end: "16:00" }],
      jueves: [{ start: "10:00", end: "16:00" }],
      viernes: [{ start: "10:00", end: "16:00" }],
      sabado: [{ start: "10:00", end: "16:00" }],
      domingo: [],
    },
  },
  saturday_only: {
    label: "Turno sábado",
    blocks: {
      lunes: [],
      martes: [],
      miercoles: [],
      jueves: [],
      viernes: [],
      sabado: [{ start: "08:00", end: "17:00" }],
      domingo: [],
    },
  },
};

const STORAGE_PREFIX = "kaiko.dashboard.data.";

const MONTHS = [
  { key: "2026-01", label: "Ene 2026", factor: 0.82 },
  { key: "2026-02", label: "Feb 2026", factor: 0.94 },
  { key: "2026-03", label: "Mar 2026", factor: 1.06 },
  { key: "2026-04", label: "Abr 2026", factor: 1.14 },
];

const CURRENT_WEEK = [
  { key: "lunes", date: "2026-03-16" },
  { key: "martes", date: "2026-03-17" },
  { key: "miercoles", date: "2026-03-18" },
  { key: "jueves", date: "2026-03-19" },
  { key: "viernes", date: TODAY },
  { key: "sabado", date: "2026-03-21" },
  { key: "domingo", date: "2026-03-22" },
];

let sequence = 0;

function createId(prefix) {
  sequence += 1;
  return `${prefix}_${Date.now()}_${String(sequence).padStart(4, "0")}`;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function timeToMinutes(value) {
  const [hours = 0, minutes = 0] = String(value || "00:00")
    .split(":")
    .map((item) => Number(item));
  return hours * 60 + minutes;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getMonthlyHours(weeklyHours) {
  return Number(weeklyHours || 0) * 4.33;
}

function computeHourlyValue(salaryBase, weeklyHours) {
  const monthlyHours = Math.max(1, getMonthlyHours(weeklyHours));
  return round(Number(salaryBase || 0) / monthlyHours, 0);
}

function createEmployee(base) {
  const hourlyValue =
    base.hourlyValue || computeHourlyValue(base.salaryBase, base.weeklyHours);

  return {
    id: createId("emp"),
    admissionDate: base.admissionDate,
    name: base.name,
    position: base.position,
    salaryBase: base.salaryBase,
    weeklyHours: base.weeklyHours,
    hourlyValue,
    restDay: base.restDay,
    shiftId: base.shiftId,
    status: base.status || "Activo",
  };
}

function buildDemoEmployees() {
  sequence = 0;

  return [
    createEmployee({
      admissionDate: "2024-11-05",
      name: "HEINER BARÓN",
      position: "Administrador",
      salaryBase: 2200000,
      weeklyHours: 46,
      restDay: "lunes",
      shiftId: "admin",
    }),
    createEmployee({
      admissionDate: "2025-01-20",
      name: "DAVID",
      position: "Operación sin contrato",
      salaryBase: 2000000,
      weeklyHours: 46,
      restDay: "domingo",
      shiftId: "general",
    }),
    createEmployee({
      admissionDate: "2025-02-01",
      name: "ARLEY GIL",
      position: "Jefe de cocina",
      salaryBase: 2500000,
      weeklyHours: 46,
      restDay: "domingo",
      shiftId: "general",
    }),
    createEmployee({
      admissionDate: "2025-02-03",
      name: "DAVID GUERRERO",
      position: "Aux. cocina",
      salaryBase: 1700000,
      weeklyHours: 46,
      restDay: "jueves",
      shiftId: "general",
    }),
    createEmployee({
      admissionDate: "2025-02-14",
      name: "MIGUEL BRICEÑO",
      position: "Cocinero",
      salaryBase: 1900000,
      weeklyHours: 46,
      restDay: "lunes",
      shiftId: "general",
    }),
    createEmployee({
      admissionDate: "2025-02-18",
      name: "HANMARIS BERMÚDEZ",
      position: "Repostera",
      salaryBase: 1800000,
      weeklyHours: 46,
      restDay: "jueves",
      shiftId: "general",
    }),
    createEmployee({
      admissionDate: "2025-02-26",
      name: "JOHANNA LEON",
      position: "Anfitriona",
      salaryBase: 1600000,
      weeklyHours: 46,
      restDay: "lunes",
      shiftId: "general",
    }),
    createEmployee({
      admissionDate: "2025-03-04",
      name: "MARLIN LUNA",
      position: "Anfitriona",
      salaryBase: 1600000,
      weeklyHours: 46,
      restDay: "martes",
      shiftId: "general",
    }),
    createEmployee({
      admissionDate: "2025-03-10",
      name: "BREINER ALVARADO",
      position: "Asis. admn",
      salaryBase: 1850000,
      weeklyHours: 46,
      restDay: "domingo",
      shiftId: "admin",
    }),
    createEmployee({
      admissionDate: "2025-03-17",
      name: "JIMENA ROBLES",
      position: "Ventas online",
      salaryBase: 1650000,
      weeklyHours: 46,
      restDay: "domingo",
      shiftId: "admin",
    }),
    createEmployee({
      admissionDate: "2025-03-24",
      name: "LISAY ÁNGEL",
      position: "Caja",
      salaryBase: 1700000,
      weeklyHours: 46,
      restDay: "sabado",
      shiftId: "general",
    }),
    createEmployee({
      admissionDate: "2025-04-08",
      name: "DARA",
      position: "Anfitriona turnera",
      salaryBase: 950000,
      weeklyHours: 30,
      restDay: "domingo",
      shiftId: "part_time_30",
    }),
    createEmployee({
      admissionDate: "2025-04-15",
      name: "N/A",
      position: "Caja turnero",
      salaryBase: 0,
      weeklyHours: 8,
      restDay: "domingo",
      shiftId: "saturday_only",
      status: "Vacante",
      hourlyValue: 0,
    }),
  ];
}

function getShiftForDay(employee, dayKey) {
  const shift = SHIFT_LIBRARY[employee.shiftId] || SHIFT_LIBRARY.general;

  if (employee.restDay === dayKey) {
    return [];
  }

  return shift.blocks[dayKey] || [];
}

function buildDemoAttendance(employees) {
  const employeeMap = Object.fromEntries(employees.map((employee) => [employee.name, employee]));

  return [
    {
      id: createId("att"),
      employeeId: employeeMap["HEINER BARÓN"].id,
      date: TODAY,
      clockIn: "",
      absenceType: "",
      notes: "Pendiente de marcar ingreso.",
    },
    {
      id: createId("att"),
      employeeId: employeeMap["ARLEY GIL"].id,
      date: "2026-03-18",
      clockIn: "08:35",
      absenceType: "",
      notes: "Atraso por abastecimiento.",
    },
    {
      id: createId("att"),
      employeeId: employeeMap["HANMARIS BERMÚDEZ"].id,
      date: "2026-03-19",
      clockIn: "",
      absenceType: "justificada",
      notes: "Cita médica.",
    },
    {
      id: createId("att"),
      employeeId: employeeMap["JOHANNA LEON"].id,
      date: "2026-03-17",
      clockIn: "",
      absenceType: "no_justificada",
      notes: "No presentó soporte.",
    },
    {
      id: createId("att"),
      employeeId: employeeMap["LISAY ÁNGEL"].id,
      date: TODAY,
      clockIn: "08:12",
      absenceType: "",
      notes: "Ingreso autorizado.",
    },
    {
      id: createId("att"),
      employeeId: employeeMap["DARA"].id,
      date: TODAY,
      clockIn: "10:18",
      absenceType: "",
      notes: "Turno parcial con atraso.",
    },
  ];
}

function buildDemoPayrollRecords(employees) {
  const positionFactors = {
    Administrador: 0.4,
    "Operación sin contrato": 0.7,
    "Jefe de cocina": 1.2,
    "Aux. cocina": 0.9,
    Cocinero: 1.1,
    Repostera: 0.85,
    Anfitriona: 0.75,
    "Asis. admn": 0.3,
    "Ventas online": 0.35,
    Caja: 0.65,
    "Anfitriona turnera": 0.55,
    "Caja turnero": 0.2,
  };

  return employees
    .filter((employee) => employee.status !== "Vacante")
    .flatMap((employee, employeeIndex) =>
      MONTHS.map((month, monthIndex) => {
        const baseFactor = positionFactors[employee.position] || 0.6;
        const overtimeHours = round((baseFactor + month.factor + employeeIndex * 0.03) * 6, 1);
        const nightHours = round((baseFactor + monthIndex * 0.15) * 2.4, 1);
        const justifiedAbsences = monthIndex === 2 && employeeIndex % 5 === 0 ? 1 : 0;
        const unjustifiedAbsences = monthIndex === 1 && employeeIndex % 6 === 0 ? 1 : 0;
        const lateHours = round((employeeIndex % 4) * 0.35 + monthIndex * 0.2, 1);
        const expectedHours = round(getMonthlyHours(employee.weeklyHours), 1);
        const lostHours = round(justifiedAbsences * 4 + unjustifiedAbsences * 8 + lateHours, 1);
        const workedHours = round(expectedHours - lostHours + overtimeHours, 1);
        const overtimeValue = round(overtimeHours * employee.hourlyValue * 1.25, 0);
        const nightSurchargeValue = round(nightHours * employee.hourlyValue * 0.35, 0);
        const finalResult = round(employee.salaryBase + overtimeValue + nightSurchargeValue, 0);

        return {
          id: createId("pay"),
          employeeId: employee.id,
          monthKey: month.key,
          monthLabel: month.label,
          year: month.key.slice(0, 4),
          month: month.key.slice(5, 7),
          position: employee.position,
          shiftLabel: SHIFT_LIBRARY[employee.shiftId].label,
          salaryBase: employee.salaryBase,
          expectedHours,
          workedHours,
          lostHours,
          overtimeHours,
          nightHours,
          lateHours,
          justifiedAbsences,
          unjustifiedAbsences,
          overtimeValue,
          nightSurchargeValue,
          finalResult,
        };
      }),
    );
}

function buildDemoExcelRows(employees, payrollRecords) {
  return employees
    .filter((employee) => employee.status !== "Vacante")
    .map((employee) => {
      const employeeRecords = payrollRecords.filter(
        (record) => record.employeeId === employee.id && record.monthKey === "2026-03",
      );
      const summary = employeeRecords[0];

      return {
        "Nombre de empleado": employee.name,
        Cargo: employee.position,
        "Faltas justificadas": summary?.justifiedAbsences || 0,
        "Faltas no justificadas": summary?.unjustifiedAbsences || 0,
        "Horas de atraso": summary?.lateHours || 0,
        "Salario base": employee.salaryBase,
        "Horas extras totales": summary?.overtimeHours || 0,
        "Valor de horas extras": summary?.overtimeValue || 0,
        "Valor de hora": employee.hourlyValue,
      };
    });
}

export function createEmptyState() {
  return {
    employees: [],
    attendance: [],
    payrollRecords: [],
    excelRows: [],
    uploadedExcelRows: [],
  };
}

export function createDemoState() {
  const employees = buildDemoEmployees();
  const attendance = buildDemoAttendance(employees);
  const payrollRecords = buildDemoPayrollRecords(employees);
  const excelRows = buildDemoExcelRows(employees, payrollRecords);

  return {
    employees,
    attendance,
    payrollRecords,
    excelRows,
    uploadedExcelRows: [],
  };
}

export function getAccountByCredentials(email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  return (
    LOGIN_ACCOUNTS.find(
      (account) =>
        account.email === normalizedEmail && String(password || "") === account.password,
    ) || null
  );
}

export function loadAccountData(accountEmail) {
  if (typeof window === "undefined") {
    return createEmptyState();
  }

  const storageKey = `${STORAGE_PREFIX}${accountEmail}`;

  try {
    const raw = window.localStorage.getItem(storageKey);

    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    return createEmptyState();
  }

  const account = LOGIN_ACCOUNTS.find((item) => item.email === accountEmail);
  const initialState = account?.mode === "demo" ? createDemoState() : createEmptyState();
  saveAccountData(accountEmail, initialState);
  return initialState;
}

export function saveAccountData(accountEmail, data) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(`${STORAGE_PREFIX}${accountEmail}`, JSON.stringify(data));
}

export function createEmployeeDraft() {
  return {
    id: "",
    admissionDate: TODAY,
    name: "",
    position: "",
    salaryBase: 0,
    weeklyHours: 46,
    hourlyValue: 0,
    restDay: "domingo",
    shiftId: "general",
    status: "Activo",
  };
}

export function upsertEmployee(data, draft) {
  const nextData = deepClone(data);
  const base = {
    ...draft,
    hourlyValue:
      Number(draft.hourlyValue || 0) || computeHourlyValue(draft.salaryBase, draft.weeklyHours),
  };

  if (base.id) {
    nextData.employees = nextData.employees.map((employee) =>
      employee.id === base.id ? { ...employee, ...base } : employee,
    );
  } else {
    nextData.employees.push({
      ...base,
      id: createId("emp"),
    });
  }

  return nextData;
}

export function deleteEmployee(data, employeeId) {
  const nextData = deepClone(data);
  const employee = nextData.employees.find((item) => item.id === employeeId);
  nextData.employees = nextData.employees.filter((employee) => employee.id !== employeeId);
  nextData.attendance = nextData.attendance.filter((entry) => entry.employeeId !== employeeId);
  nextData.payrollRecords = nextData.payrollRecords.filter((record) => record.employeeId !== employeeId);
  nextData.excelRows = nextData.excelRows.filter((row) =>
    employee
      ? normalizeText(row["Nombre de empleado"]) !== normalizeText(employee.name)
      : true,
  );
  return nextData;
}

export function upsertAttendance(data, payload) {
  const nextData = deepClone(data);
  const current = nextData.attendance.find(
    (entry) => entry.employeeId === payload.employeeId && entry.date === payload.date,
  );

  if (current) {
    Object.assign(current, payload);
    return nextData;
  }

  nextData.attendance.push({
    id: createId("att"),
    employeeId: payload.employeeId,
    date: payload.date,
    clockIn: payload.clockIn || "",
    absenceType: payload.absenceType || "",
    notes: payload.notes || "",
  });
  return nextData;
}

export function setUploadedExcelRows(data, rows) {
  return {
    ...deepClone(data),
    uploadedExcelRows: rows,
  };
}

function sumRecord(records, field) {
  return round(records.reduce((total, record) => total + Number(record[field] || 0), 0), 1);
}

function groupBy(records, keyBuilder, valueBuilder) {
  const map = new Map();

  records.forEach((record) => {
    const key = keyBuilder(record);
    const current = map.get(key.id) || { label: key.label, value: 0 };
    current.value += valueBuilder(record);
    map.set(key.id, current);
  });

  return Array.from(map.entries())
    .map(([id, item]) => ({
      id,
      label: item.label,
      value: round(item.value, 1),
    }))
    .sort((left, right) => right.value - left.value);
}

export function getShiftBlocks(employee, dayKey) {
  return getShiftForDay(employee, dayKey);
}

export function getAttendanceState(employee, date, data) {
  const weekDay = CURRENT_WEEK.find((item) => item.date === date)?.key;
  const shiftBlocks = weekDay ? getShiftForDay(employee, weekDay) : [];
  const attendance = data.attendance.find(
    (entry) => entry.employeeId === employee.id && entry.date === date,
  );

  if (!shiftBlocks.length) {
    return {
      status: "descanso",
      label: "Descanso",
      lateHours: 0,
      shiftBlocks,
      attendance,
    };
  }

  const startTime = shiftBlocks[0].start;
  const startMinutes = timeToMinutes(startTime);
  const controlTime = timeToMinutes(date === TODAY ? CURRENT_TIME : "23:59");

  if (attendance?.absenceType === "justificada") {
    return {
      status: "justificada",
      label: "Falta justificada",
      lateHours: 0,
      shiftBlocks,
      attendance,
    };
  }

  if (attendance?.absenceType === "no_justificada") {
    return {
      status: "no_justificada",
      label: "Falta no justificada",
      lateHours: 0,
      shiftBlocks,
      attendance,
    };
  }

  if (attendance?.clockIn) {
    const lateHours = Math.max(0, round((timeToMinutes(attendance.clockIn) - startMinutes) / 60));
    return {
      status: lateHours > 0 ? "atraso" : "presente",
      label: lateHours > 0 ? `Atraso ${lateHours} h` : "Presente",
      lateHours,
      shiftBlocks,
      attendance,
    };
  }

  if (date < TODAY) {
    return {
      status: "no_justificada",
      label: "Falta no justificada",
      lateHours: 0,
      shiftBlocks,
      attendance,
    };
  }

  if (date === TODAY && controlTime > startMinutes) {
    const lateHours = round((controlTime - startMinutes) / 60);
    return {
      status: "atraso_pendiente",
      label: `Atraso en curso ${lateHours} h`,
      lateHours,
      shiftBlocks,
      attendance,
    };
  }

  return {
    status: "pendiente",
    label: "Pendiente",
    lateHours: 0,
    shiftBlocks,
    attendance,
  };
}

export function getScheduleWeekView(data) {
  const activeEmployees = data.employees.filter((employee) => employee.status !== "Vacante");

  return {
    days: CURRENT_WEEK,
    rows: activeEmployees.map((employee) => ({
      employee,
      days: CURRENT_WEEK.map((day) => ({
        ...day,
        state: getAttendanceState(employee, day.date, data),
      })),
    })),
  };
}

export function getCurrentOperationsStats(data) {
  const todayRows = getScheduleWeekView(data).rows.map((row) =>
    row.days.find((day) => day.date === TODAY),
  );

  return {
    workingNow: todayRows.filter((day) => day?.state.status === "presente" || day?.state.status === "atraso").length,
    justifiedAbsences: todayRows.filter((day) => day?.state.status === "justificada").length,
    unjustifiedAbsences: todayRows.filter((day) => day?.state.status === "no_justificada").length,
    lateHours: round(todayRows.reduce((total, day) => total + Number(day?.state.lateHours || 0), 0)),
  };
}

export function getPayrollFiltersOptions(data) {
  return {
    years: [...new Set(data.payrollRecords.map((record) => record.year))],
    months: MONTHS,
    positions: [...new Set(data.employees.map((employee) => employee.position).filter(Boolean))],
  };
}

export function filterPayrollRecords(data, filters) {
  return data.payrollRecords.filter((record) => {
    if (filters.year && record.year !== filters.year) {
      return false;
    }

    if (filters.monthKey && record.monthKey !== filters.monthKey) {
      return false;
    }

    if (filters.employeeId && record.employeeId !== filters.employeeId) {
      return false;
    }

    if (filters.position && record.position !== filters.position) {
      return false;
    }

    return true;
  });
}

export function getPayrollDashboard(data, filters) {
  const records = filterPayrollRecords(data, filters);
  const activeEmployees = data.employees.filter((employee) => employee.status === "Activo").length;

  return {
    summary: {
      overtimeSpend: sumRecord(records, "overtimeValue"),
      overtimeHours: sumRecord(records, "overtimeHours"),
      plannedHours: sumRecord(records, "expectedHours"),
      workedHours: sumRecord(records, "workedHours"),
      lostHours: sumRecord(records, "lostHours"),
      salaryBase: sumRecord(records, "salaryBase"),
      nightSurcharge: sumRecord(records, "nightSurchargeValue"),
      finalTotal:
        sumRecord(records, "salaryBase") +
        sumRecord(records, "overtimeValue") +
        sumRecord(records, "nightSurchargeValue"),
      activeEmployees,
    },
    charts: {
      overtimeByMonth: groupBy(
        records,
        (record) => ({ id: record.monthKey, label: record.monthLabel }),
        (record) => record.overtimeHours,
      ),
      spendByMonth: groupBy(
        records,
        (record) => ({ id: record.monthKey, label: record.monthLabel }),
        (record) => record.overtimeValue,
      ),
      overtimeByPosition: groupBy(
        records,
        (record) => ({ id: record.position, label: record.position }),
        (record) => record.overtimeHours,
      ),
      overtimeByShift: groupBy(
        records,
        (record) => ({ id: record.shiftLabel, label: record.shiftLabel }),
        (record) => record.overtimeHours,
      ),
      overtimeByEmployee: groupBy(
        records,
        (record) => ({ id: record.employeeId, label: data.employees.find((item) => item.id === record.employeeId)?.name || "Empleado" }),
        (record) => record.overtimeHours,
      ),
      employeesByPosition: groupBy(
        data.employees.filter((employee) => employee.status !== "Vacante"),
        (employee) => ({ id: employee.position, label: employee.position }),
        () => 1,
      ),
      finalByMonth: groupBy(
        records,
        (record) => ({ id: record.monthKey, label: record.monthLabel }),
        (record) => record.finalResult,
      ),
      finalExpenseByMonth: groupBy(
        records,
        (record) => ({ id: record.monthKey, label: record.monthLabel }),
        (record) => record.overtimeValue + record.nightSurchargeValue,
      ),
    },
    currentOps: getCurrentOperationsStats(data),
  };
}

export function getExcelRows(data) {
  return data.uploadedExcelRows.length ? data.uploadedExcelRows : data.excelRows;
}
