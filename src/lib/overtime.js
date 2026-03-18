const CURRENT_PERIOD = "2026-03-18";

export const SOURCE_LINKS = [
  {
    label: "API Aleluya",
    href: "https://api.aleluya.com/",
    note: "Contrato OpenAPI base para autenticacion, conceptos y overtime_items.",
  },
  {
    label: "Actualicese - Reforma laboral",
    href: "https://actualicese.com/reforma-laboral-ley-2466-de-2025-consulte-la-vigencia-de-cada-cambio/",
    note: "Resumen de vigencias de jornada nocturna, recargos y reduccion de jornada.",
  },
  {
    label: "Gerencie - Recargos y horas extras",
    href: "https://www.gerencie.com/recargos-nocturnos-horas-extras-y-trabajo-dominical-y-festivo.html",
    note: "Tabla de combinaciones de recargos en Colombia usada como apoyo operativo.",
  },
];

export const LEGAL_TIMELINE = [
  {
    date: "2025-07-01",
    title: "Dominical y festivo al 80%",
    detail:
      "Aleluya documenta que desde el 1 de julio de 2025 el recargo dominical y festivo sube a 80%.",
  },
  {
    date: "2025-12-25",
    title: "Jornada nocturna desde las 7:00 p.m.",
    detail:
      "Se toma como fecha operativa de reforma para anticipar el cambio de 9:00 p.m. a 7:00 p.m.",
  },
  {
    date: "2026-07-01",
    title: "Dominical y festivo al 90%",
    detail:
      "La propia documentacion de Aleluya exige period_id para calcular correctamente esta vigencia.",
  },
  {
    date: "2026-07-15",
    title: "Jornada maxima semanal de 42 horas",
    detail:
      "La formula del valor hora cambia en periodos posteriores a esta fecha si se usa salario mensual.",
  },
  {
    date: "2027-07-01",
    title: "Dominical y festivo al 100%",
    detail:
      "Queda configurado como la ultima escala publicada por Aleluya para la reforma laboral.",
  },
];

export const FIELD_DEFINITIONS = [
  { key: "employeeName", label: "Nombre de la persona", required: true },
  { key: "documentNumber", label: "Documento", required: true },
  { key: "baseSalary", label: "Salario base mensual", required: false },
  { key: "hourlyRate", label: "Valor hora directo", required: false },
  { key: "periodDate", label: "Fecha del periodo", required: false },
  { key: "payrollId", label: "Payroll ID Aleluya", required: false },
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
  payrollId: ["payroll_id", "nomina_id", "id_nomina", "id_payroll"],
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
    Salario: 3200000,
    Fecha: "2026-03-15",
    payroll_id: "8ed4a720-11e3-4a8f-a1a2-011203fcb001",
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
    Salario: 2400000,
    Fecha: "2026-03-15",
    payroll_id: "8ed4a720-11e3-4a8f-a1a2-011203fcb002",
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
    Salario: 4100000,
    Fecha: "2026-08-15",
    payroll_id: "8ed4a720-11e3-4a8f-a1a2-011203fcb003",
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
      aleluyaCodes: ["daily_hour"],
      nameHints: ["hora_extra_diurna", "extra_diurna"],
      detail: "Se liquida como hora ordinaria mas 25%.",
    },
    {
      key: "extraNight",
      short: "HEN",
      label: "Hora extra nocturna",
      family: "extra_hours",
      mode: "full",
      multiplier: 1.75,
      aleluyaCodes: ["nightly_hour"],
      nameHints: ["hora_extra_nocturna", "extra_nocturna"],
      detail: "Se liquida como hora ordinaria mas 75%.",
    },
    {
      key: "nightSurcharge",
      short: "RN",
      label: "Recargo nocturno",
      family: "surcharges",
      mode: "increment",
      multiplier: 0.35,
      aleluyaCodes: ["nightly_surcharge"],
      nameHints: ["recargo_nocturno"],
      detail: "Adicional del 35% sobre jornada ordinaria nocturna.",
    },
    {
      key: "sundayDaySurcharge",
      short: "DF",
      label: "Dominical o festivo diurno",
      family: "surcharges",
      mode: "increment",
      multiplier: sundayRate,
      aleluyaCodes: [
        "dominical_surcharge",
        "holiday_surcharge",
        "sunday_surcharge",
      ],
      nameHints: ["dominical", "festivo"],
      detail: `Adicional vigente del ${(sundayRate * 100).toFixed(0)}% para dominical y festivo.`,
    },
    {
      key: "sundayNightSurcharge",
      short: "RNDF",
      label: "Dominical o festivo nocturno",
      family: "surcharges",
      mode: "increment",
      multiplier: sundayRate + 0.35,
      aleluyaCodes: [
        "dominical_nightly_surcharge",
        "holiday_nightly_surcharge",
      ],
      nameHints: ["dominical_nocturno", "festivo_nocturno"],
      detail: "Suma el recargo dominical o festivo con el recargo nocturno.",
    },
    {
      key: "extraSundayDay",
      short: "HEDF",
      label: "Hora extra diurna dominical o festiva",
      family: "extra_hours",
      mode: "full",
      multiplier: 1.25 + sundayRate,
      aleluyaCodes: ["dominical_daily_hour", "holiday_daily_hour"],
      nameHints: ["extra_dominical_diurna", "hora_extra_diurna_dominical"],
      detail: "Hora extra diurna mas recargo dominical o festivo vigente.",
    },
    {
      key: "extraSundayNight",
      short: "HENDF",
      label: "Hora extra nocturna dominical o festiva",
      family: "extra_hours",
      mode: "full",
      multiplier: 1.75 + sundayRate,
      aleluyaCodes: ["dominical_nightly_hour", "holiday_nightly_hour"],
      nameHints: ["extra_dominical_nocturna", "hora_extra_nocturna_dominical"],
      detail: "Hora extra nocturna mas recargo dominical o festivo vigente.",
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

function resolvePayrollMatch(employee, payrolls) {
  if (!Array.isArray(payrolls) || payrolls.length === 0) {
    return null;
  }

  if (employee.payrollId) {
    return (
      payrolls.find((payroll) => payroll.id === employee.payrollId) || {
        id: employee.payrollId,
        worker_name: employee.employeeName,
        worker_id_number: employee.documentNumber,
      }
    );
  }

  const normalizedDocument = normalizeText(employee.documentNumber);
  const normalizedName = normalizeText(employee.employeeName);

  return (
    payrolls.find(
      (payroll) =>
        normalizeText(payroll.worker_id_number) === normalizedDocument ||
        normalizeText(payroll.worker_name) === normalizedName,
    ) || null
  );
}

export function buildEmployees(rows, mapping, settings, payrolls = []) {
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
        baseSalary,
        hourlyRate,
        periodDate,
        payrollId: String(getMappedValue(row, mapping, "payrollId") || "").trim(),
        quantities: {},
        catalog,
      });
    }

    const employee = employeeMap.get(employeeKey);
    employee.baseSalary = employee.baseSalary || baseSalary;
    employee.hourlyRate = employee.hourlyRate || hourlyRate;
    employee.periodDate = employee.periodDate || periodDate;
    employee.payrollId = employee.payrollId || String(getMappedValue(row, mapping, "payrollId") || "").trim();
    employee.catalog = catalog;

    catalog.forEach((concept) => {
      const quantity = toNumber(getMappedValue(row, mapping, concept.key));
      employee.quantities[concept.key] = (employee.quantities[concept.key] || 0) + quantity;
    });
  });

  return Array.from(employeeMap.values())
    .map((employee) => {
      const matchedPayroll = resolvePayrollMatch(employee, payrolls);
      const breakdown = employee.catalog
        .map((concept) => {
          const quantity = employee.quantities[concept.key] || 0;
          const unitValue =
            concept.mode === "full"
              ? employee.hourlyRate * concept.multiplier
              : employee.hourlyRate * concept.multiplier;
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
        resolvedPayrollId: matchedPayroll?.id || employee.payrollId || "",
        matchedPayroll,
        breakdown,
        overtimeHours,
        surchargeHours,
        totalValue,
        weeklyHours: getWeeklyHours(employee.periodDate),
        monthlyHours: getMonthlyHours(
          employee.periodDate,
          settings.workingDaysPerWeek,
        ),
        sundayRate: getSundayRate(employee.periodDate),
        nightShiftStartHour: getNightShiftStartHour(employee.periodDate),
      };
    })
    .sort((left, right) => right.totalValue - left.totalValue);
}

export function flattenAleluyaConcepts(payload) {
  const data = payload?.data || payload || {};

  if (Array.isArray(data)) {
    return data;
  }

  return Object.entries(data).flatMap(([group, items]) =>
    (Array.isArray(items) ? items : []).map((item) => ({
      ...item,
      group,
    })),
  );
}

function resolveConceptMatch(line, aleluyaConcepts) {
  return (
    aleluyaConcepts.find((concept) =>
      line.aleluyaCodes.includes(normalizeText(concept.coded_name)),
    ) ||
    aleluyaConcepts.find((concept) => {
      const normalizedName = normalizeText(concept.name);
      return line.nameHints.some((hint) => normalizedName.includes(hint));
    }) ||
    null
  );
}

export function buildAleluyaPayload(employee, aleluyaConcepts, existingItems = []) {
  const unresolved = [];

  const items = employee.breakdown
    .map((line) => {
      const matchedConcept = resolveConceptMatch(line, aleluyaConcepts);

      if (!matchedConcept) {
        unresolved.push(line.label);
        return null;
      }

      const previousItem =
        existingItems.find((item) => item.payroll_concept_id === matchedConcept.id) ||
        existingItems.find(
          (item) =>
            normalizeText(item.coded_name) === normalizeText(matchedConcept.coded_name),
        ) ||
        null;

      return {
        id: previousItem?.id || "",
        payroll_concept_id: matchedConcept.id,
        quantity: Number(line.quantity.toFixed(2)),
        value: Math.round(line.totalValue),
        coded_name: matchedConcept.coded_name,
        label: line.label,
      };
    })
    .filter(Boolean);

  return {
    items,
    unresolved,
  };
}

export function buildPayloadFormData(items) {
  const params = new URLSearchParams();

  items.forEach((item, index) => {
    if (item.id) {
      params.append(`items[${index}][id]`, item.id);
    }

    params.append(`items[${index}][payroll_concept_id]`, item.payroll_concept_id);
    params.append(`items[${index}][quantity]`, String(item.quantity));
    params.append(`items[${index}][value]`, String(item.value));
  });

  return params;
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
