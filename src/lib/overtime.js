const CURRENT_PERIOD = "2026-03-18";

export const SOURCE_LINKS = [
  {
    label: "Actualícese - Reforma laboral",
    href: "https://actualicese.com/reforma-laboral-ley-2466-de-2025-consulte-la-vigencia-de-cada-cambio/",
    note: "Resumen práctico de vigencias para jornada nocturna, dominicales y reducción de jornada.",
  },
  {
    label: "Gerencie - Recargos y horas extras",
    href: "https://www.gerencie.com/recargos-nocturnos-horas-extras-y-trabajo-dominical-y-festivo.html",
    note: "Tabla operativa usada como apoyo para validar combinaciones de recargos en Colombia.",
  },
];

export const LEGAL_TIMELINE = [
  {
    date: "2025-07-01",
    title: "Dominical y festivo al 80%",
    detail:
      "Desde esta fecha la liquidación dominical y festiva debe contemplar el 80% de recargo.",
  },
  {
    date: "2025-12-25",
    title: "Jornada nocturna desde las 7:00 p.m.",
    detail:
      "La operación nocturna se calcula desde las 7:00 p.m. en adelante para períodos posteriores a esta fecha.",
  },
  {
    date: "2026-07-01",
    title: "Dominical y festivo al 90%",
    detail:
      "A partir de julio de 2026 el recargo dominical y festivo debe subir al 90%.",
  },
  {
    date: "2026-07-15",
    title: "Jornada máxima semanal de 42 horas",
    detail:
      "El valor hora de referencia cambia si la empresa liquida con base en salario mensual.",
  },
  {
    date: "2027-07-01",
    title: "Dominical y festivo al 100%",
    detail:
      "Se contempla la última escala progresiva para el recargo dominical y festivo.",
  },
];

export const FIELD_DEFINITIONS = [
  { key: "employeeName", label: "Nombre de la persona", required: true },
  { key: "documentNumber", label: "Documento", required: true },
  { key: "internalCode", label: "Código interno", required: false },
  { key: "baseSalary", label: "Salario base mensual", required: false },
  { key: "hourlyRate", label: "Valor hora directo", required: false },
  { key: "periodDate", label: "Fecha del período", required: false },
  { key: "extraDay", label: "Hora extra diurna", required: false },
  { key: "extraNight", label: "Hora extra nocturna", required: false },
  { key: "nightSurcharge", label: "Recargo nocturno", required: false },
  {
    key: "sundayDaySurcharge",
    label: "Dominical o festivo diurno",
    required: false,
  },
  {
    key: "sundayNightSurcharge",
    label: "Dominical o festivo nocturno",
    required: false,
  },
  {
    key: "extraSundayDay",
    label: "Hora extra diurna dominical o festiva",
    required: false,
  },
  {
    key: "extraSundayNight",
    label: "Hora extra nocturna dominical o festiva",
    required: false,
  },
];

const FIELD_MATCHERS = {
  employeeName: [
    "empleado",
    "trabajador",
    "persona",
    "nombre",
    "colaborador",
    "worker_name",
    "employee_name",
  ],
  documentNumber: [
    "documento",
    "cedula",
    "identificacion",
    "id_number",
    "document_number",
    "numero_documento",
    "nro_documento",
  ],
  internalCode: [
    "codigo",
    "codigo_interno",
    "consecutivo",
    "nomina_id",
    "payroll_id",
    "id_nomina",
    "id_payroll",
  ],
  baseSalary: [
    "salario",
    "salario_base",
    "sueldo",
    "base_salary",
    "salario_mensual",
  ],
  hourlyRate: [
    "valor_hora",
    "tarifa_hora",
    "hora_base",
    "hourly_rate",
    "valorhora",
  ],
  periodDate: [
    "fecha",
    "periodo",
    "period_date",
    "fecha_periodo",
    "fecha_liquidacion",
    "initial_day",
  ],
  extraDay: ["hed", "hora_extra_diurna", "extra_diurna", "daily_hour"],
  extraNight: ["hen", "hora_extra_nocturna", "extra_nocturna", "nightly_hour"],
  nightSurcharge: [
    "rn",
    "recargo_nocturno",
    "nightly_surcharge",
    "surcharge_night",
  ],
  sundayDaySurcharge: [
    "df",
    "dominical_festivo",
    "recargo_dominical",
    "festivo_diurno",
    "dominical_diurno",
  ],
  sundayNightSurcharge: [
    "rndf",
    "recargo_nocturno_dominical",
    "dominical_nocturno",
    "festivo_nocturno",
  ],
  extraSundayDay: [
    "hedf",
    "hora_extra_diurna_dominical",
    "extra_dominical_diurna",
    "dominical_daily_hour",
  ],
  extraSundayNight: [
    "hendf",
    "hora_extra_nocturna_dominical",
    "extra_dominical_nocturna",
    "dominical_nightly_hour",
  ],
};

export const DEFAULT_SETTINGS = {
  periodDate: CURRENT_PERIOD,
  workingDaysPerWeek: 6,
  salaryMode: "monthly",
  country: "Colombia",
};

export const SAMPLE_ROWS = [
  {
    Empleado: "Lina Mercado",
    Documento: "1032456712",
    "Código Interno": "SDQ-001",
    Salario: 3200000,
    Fecha: "2026-03-15",
    HED: 6,
    HEN: 2,
    RN: 10,
    DF: 1,
    HEDF: 0,
    HENDF: 1,
  },
  {
    Empleado: "Carlos Rojas",
    Documento: "79981122",
    "Código Interno": "SDQ-002",
    Salario: 2400000,
    Fecha: "2026-03-15",
    HED: 4,
    HEN: 1,
    RN: 6,
    DF: 0,
    HEDF: 2,
    HENDF: 0,
  },
  {
    Empleado: "Yuliana Torres",
    Documento: "52890144",
    "Código Interno": "SDQ-003",
    Salario: 4100000,
    Fecha: "2026-08-15",
    HED: 3,
    HEN: 2,
    RN: 4,
    DF: 2,
    HEDF: 1,
    HENDF: 1,
  },
];

function asDate(value) {
  if (!value) {
    return new Date(`${CURRENT_PERIOD}T00:00:00`);
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "number") {
    const excelOffset = Math.round((value - 25569) * 86400 * 1000);
    const parsedExcelDate = new Date(excelOffset);

    if (!Number.isNaN(parsedExcelDate.getTime())) {
      return parsedExcelDate;
    }
  }

  const normalized = String(value).trim();

  if (!normalized) {
    return new Date(`${CURRENT_PERIOD}T00:00:00`);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return new Date(`${normalized}T00:00:00`);
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(normalized)) {
    const [day, month, year] = normalized.split("/");
    return new Date(`${year}-${month}-${day}T00:00:00`);
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(normalized)) {
    const [day, month, year] = normalized.split("-");
    return new Date(`${year}-${month}-${day}T00:00:00`);
  }

  const parsedDate = new Date(normalized);
  return Number.isNaN(parsedDate.getTime())
    ? new Date(`${CURRENT_PERIOD}T00:00:00`)
    : parsedDate;
}

function isoDate(dateValue) {
  return asDate(dateValue).toISOString().slice(0, 10);
}

export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function toNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const sanitized = value
      .trim()
      .replace(/\$/g, "")
      .replace(/\s+/g, "")
      .replace(/\./g, "")
      .replace(/,/g, ".");

    const numericValue = Number(sanitized);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  return 0;
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

export function formatNumber(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits,
  }).format(value || 0);
}

export function getSundayRate(dateValue) {
  const date = asDate(dateValue);

  if (date < new Date("2025-07-01T00:00:00")) {
    return 0.75;
  }

  if (date < new Date("2026-07-01T00:00:00")) {
    return 0.8;
  }

  if (date < new Date("2027-07-01T00:00:00")) {
    return 0.9;
  }

  return 1;
}

export function getNightShiftStartHour(dateValue) {
  const date = asDate(dateValue);
  return date >= new Date("2025-12-25T00:00:00") ? 19 : 21;
}

export function getWeeklyHours(dateValue) {
  const date = asDate(dateValue);

  if (date >= new Date("2026-07-15T00:00:00")) {
    return 42;
  }

  if (date >= new Date("2025-07-15T00:00:00")) {
    return 44;
  }

  if (date >= new Date("2024-07-15T00:00:00")) {
    return 46;
  }

  if (date >= new Date("2023-07-15T00:00:00")) {
    return 47;
  }

  return 48;
}

export function getMonthlyHours(dateValue, workingDaysPerWeek = 6) {
  const safeWorkingDays = Math.max(1, Number(workingDaysPerWeek) || 6);
  return getWeeklyHours(dateValue) * (30 / safeWorkingDays);
}

export function buildConceptCatalog(dateValue) {
  const sundayRate = getSundayRate(dateValue);

  return [
    {
      key: "extraDay",
      short: "HED",
      label: "Hora extra diurna",
      family: "extra_hours",
      mode: "full",
      multiplier: 1.25,
      detail: "Se liquida como hora ordinaria más 25%.",
    },
    {
      key: "extraNight",
      short: "HEN",
      label: "Hora extra nocturna",
      family: "extra_hours",
      mode: "full",
      multiplier: 1.75,
      detail: "Se liquida como hora ordinaria más 75%.",
    },
    {
      key: "nightSurcharge",
      short: "RN",
      label: "Recargo nocturno",
      family: "surcharges",
      mode: "increment",
      multiplier: 0.35,
      detail: "Adicional del 35% sobre jornada ordinaria nocturna.",
    },
    {
      key: "sundayDaySurcharge",
      short: "DF",
      label: "Dominical o festivo diurno",
      family: "surcharges",
      mode: "increment",
      multiplier: sundayRate,
      detail: `Adicional vigente del ${(sundayRate * 100).toFixed(0)}% para dominical y festivo.`,
    },
    {
      key: "sundayNightSurcharge",
      short: "RNDF",
      label: "Dominical o festivo nocturno",
      family: "surcharges",
      mode: "increment",
      multiplier: sundayRate + 0.35,
      detail: "Suma el recargo dominical o festivo con el recargo nocturno.",
    },
    {
      key: "extraSundayDay",
      short: "HEDF",
      label: "Hora extra diurna dominical o festiva",
      family: "extra_hours",
      mode: "full",
      multiplier: 1.25 + sundayRate,
      detail: "Hora extra diurna más recargo dominical o festivo vigente.",
    },
    {
      key: "extraSundayNight",
      short: "HENDF",
      label: "Hora extra nocturna dominical o festiva",
      family: "extra_hours",
      mode: "full",
      multiplier: 1.75 + sundayRate,
      detail: "Hora extra nocturna más recargo dominical o festivo vigente.",
    },
  ];
}

export function detectColumnMap(headers) {
  const nextMap = {};
  const cleanHeaders = headers.filter(Boolean);

  FIELD_DEFINITIONS.forEach((field) => {
    const matchedHeader = cleanHeaders.find((header) => {
      const normalizedHeader = normalizeText(header);
      return (FIELD_MATCHERS[field.key] || []).some((matcher) =>
        normalizedHeader.includes(matcher),
      );
    });

    nextMap[field.key] = matchedHeader || "";
  });

  return nextMap;
}

function getMappedValue(row, mapping, key) {
  const header = mapping[key];
  return header ? row[header] : "";
}

function buildEmployeeKey(name, documentNumber, index) {
  return `${normalizeText(name) || "empleado"}-${documentNumber || index}`;
}

function calculateRate(config, row, periodDate) {
  const directHourlyRate = toNumber(getMappedValue(row, config.mapping, "hourlyRate"));
  if (directHourlyRate > 0) {
    return directHourlyRate;
  }

  const baseSalary = toNumber(getMappedValue(row, config.mapping, "baseSalary"));

  if (baseSalary <= 0) {
    return 0;
  }

  const monthlyHours = getMonthlyHours(periodDate, config.settings.workingDaysPerWeek);
  return monthlyHours > 0 ? baseSalary / monthlyHours : 0;
}

export function buildEmployees(rows, mapping, settings) {
  const employeeMap = new Map();

  rows.forEach((row, index) => {
    const employeeName = String(getMappedValue(row, mapping, "employeeName") || "").trim();
    const documentNumber = String(
      getMappedValue(row, mapping, "documentNumber") || "",
    ).trim();

    if (!employeeName && !documentNumber) {
      return;
    }

    const periodDate = isoDate(
      getMappedValue(row, mapping, "periodDate") || settings.periodDate,
    );
    const employeeKey = buildEmployeeKey(employeeName, documentNumber, index);
    const catalog = buildConceptCatalog(periodDate);
    const hourlyRate = calculateRate({ mapping, settings }, row, periodDate);
    const baseSalary = toNumber(getMappedValue(row, mapping, "baseSalary"));

    if (!employeeMap.has(employeeKey)) {
      employeeMap.set(employeeKey, {
        id: employeeKey,
        employeeName,
        documentNumber,
        internalCode: String(getMappedValue(row, mapping, "internalCode") || "").trim(),
        baseSalary,
        hourlyRate,
        periodDate,
        quantities: {},
        catalog,
      });
    }

    const employee = employeeMap.get(employeeKey);
    employee.baseSalary = employee.baseSalary || baseSalary;
    employee.hourlyRate = employee.hourlyRate || hourlyRate;
    employee.periodDate = employee.periodDate || periodDate;
    employee.internalCode =
      employee.internalCode || String(getMappedValue(row, mapping, "internalCode") || "").trim();
    employee.catalog = catalog;

    catalog.forEach((concept) => {
      const quantity = toNumber(getMappedValue(row, mapping, concept.key));
      employee.quantities[concept.key] = (employee.quantities[concept.key] || 0) + quantity;
    });
  });

  return Array.from(employeeMap.values())
    .map((employee) => {
      const breakdown = employee.catalog
        .map((concept) => {
          const quantity = employee.quantities[concept.key] || 0;
          const unitValue = employee.hourlyRate * concept.multiplier;
          const totalValue = quantity * unitValue;

          return {
            ...concept,
            quantity,
            unitValue,
            totalValue,
          };
        })
        .filter((line) => line.quantity > 0);

      const overtimeHours = breakdown
        .filter((line) => line.family === "extra_hours")
        .reduce((sum, line) => sum + line.quantity, 0);
      const surchargeHours = breakdown
        .filter((line) => line.family === "surcharges")
        .reduce((sum, line) => sum + line.quantity, 0);
      const totalValue = breakdown.reduce((sum, line) => sum + line.totalValue, 0);

      return {
        ...employee,
        breakdown,
        overtimeHours,
        surchargeHours,
        totalValue,
        weeklyHours: getWeeklyHours(employee.periodDate),
        monthlyHours: getMonthlyHours(employee.periodDate, settings.workingDaysPerWeek),
        sundayRate: getSundayRate(employee.periodDate),
        nightShiftStartHour: getNightShiftStartHour(employee.periodDate),
      };
    })
    .sort((left, right) => right.totalValue - left.totalValue);
}

export function summarizeEmployees(employees) {
  return employees.reduce(
    (summary, employee) => {
      summary.totalEmployees += 1;
      summary.totalOvertimeHours += employee.overtimeHours;
      summary.totalSurchargeHours += employee.surchargeHours;
      summary.totalValue += employee.totalValue;
      return summary;
    },
    {
      totalEmployees: 0,
      totalOvertimeHours: 0,
      totalSurchargeHours: 0,
      totalValue: 0,
    },
  );
}

export function summarizeByConcept(employees) {
  const summaryMap = new Map();

  employees.forEach((employee) => {
    employee.breakdown.forEach((line) => {
      const current = summaryMap.get(line.key) || {
        key: line.key,
        short: line.short,
        label: line.label,
        quantity: 0,
        totalValue: 0,
      };

      current.quantity += line.quantity;
      current.totalValue += line.totalValue;
      summaryMap.set(line.key, current);
    });
  });

  return Array.from(summaryMap.values()).sort(
    (left, right) => right.totalValue - left.totalValue,
  );
}

export function buildOperationalAlerts(employees) {
  const alerts = [];

  const employeesWithoutRate = employees.filter((employee) => employee.hourlyRate <= 0);
  if (employeesWithoutRate.length) {
    alerts.push({
      type: "warning",
      title: "Personas sin valor hora calculado",
      detail: `${employeesWithoutRate.length} registros no tienen salario base ni valor hora directo.`,
    });
  }

  const employeesWithoutId = employees.filter((employee) => !employee.internalCode);
  if (employeesWithoutId.length) {
    alerts.push({
      type: "info",
      title: "Códigos internos pendientes",
      detail: `${employeesWithoutId.length} personas no tienen código interno asociado en la base.`,
    });
  }

  const dominantSunday = employees.filter((employee) => employee.sundayRate >= 0.9);
  if (dominantSunday.length) {
    alerts.push({
      type: "info",
      title: "Período con dominical al 90% o más",
      detail: `${dominantSunday.length} personas están siendo liquidadas bajo una vigencia dominical alta.`,
    });
  }

  const highValueEmployees = employees.filter((employee) => employee.totalValue >= 300000);
  if (highValueEmployees.length) {
    alerts.push({
      type: "warning",
      title: "Valores elevados para revisar",
      detail: `${highValueEmployees.length} personas superan $300.000 en extras y recargos.`,
    });
  }

  if (!alerts.length) {
    alerts.push({
      type: "success",
      title: "Base consistente",
      detail: "No se detectaron alertas prioritarias en la revisión automática.",
    });
  }

  return alerts;
}

export function buildEmployeeReport(employee) {
  if (!employee) {
    return null;
  }

  return {
    empleado: employee.employeeName,
    documento: employee.documentNumber,
    codigo_interno: employee.internalCode || null,
    periodo: employee.periodDate,
    salario_base: Math.round(employee.baseSalary || 0),
    valor_hora: Math.round(employee.hourlyRate || 0),
    jornada_nocturna_desde: `${employee.nightShiftStartHour}:00`,
    recargo_dominical_festivo: `${Math.round(employee.sundayRate * 100)}%`,
    totales: {
      horas_extras: Number(employee.overtimeHours.toFixed(2)),
      recargos: Number(employee.surchargeHours.toFixed(2)),
      valor_total: Math.round(employee.totalValue),
    },
    detalle: employee.breakdown.map((line) => ({
      concepto: line.label,
      codigo: line.short,
      cantidad: Number(line.quantity.toFixed(2)),
      multiplicador: Number(line.multiplier.toFixed(2)),
      valor_unitario: Math.round(line.unitValue),
      valor_total: Math.round(line.totalValue),
    })),
  };
}
