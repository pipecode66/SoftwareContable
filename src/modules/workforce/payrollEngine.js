import {
  CURRENT_DATE,
  CONTRACT_TYPES,
  PAYMENT_FREQUENCIES,
  PERIOD_TYPES,
} from "./data";
import {
  buildConceptCatalog,
  formatCurrency,
  formatNumber,
  getNightShiftStartHour,
  getSundayRate,
} from "../../lib/overtime";

function toNumber(value) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function listReferenceOptions() {
  return {
    contractTypes: CONTRACT_TYPES,
    paymentFrequencies: PAYMENT_FREQUENCIES,
    periodTypes: PERIOD_TYPES,
  };
}

export function resolveEmployeeRules(employee) {
  const rules = {
    aplica_horas_extras: Boolean(employee.aplica_horas_extras),
    aplica_recargo_nocturno: Boolean(employee.aplica_recargo_nocturno),
    aplica_recargo_dominical: Boolean(employee.aplica_recargo_dominical),
    aplica_recargo_festivo: Boolean(employee.aplica_recargo_festivo),
    aplica_recargo_nocturno_dominical: Boolean(employee.aplica_recargo_nocturno_dominical),
  };

  const traces = [];

  if (employee.es_cargo_manejo_confianza) {
    rules.aplica_horas_extras = false;
    traces.push("Cargo de manejo y confianza: se bloquean las horas extras.");
  }

  if (employee.tipo_contrato === "sin_contrato") {
    rules.aplica_horas_extras = false;
    rules.aplica_recargo_nocturno = false;
    rules.aplica_recargo_nocturno_dominical = false;
    traces.push("Personal sin contrato: no aplica horas extras ni recargo nocturno.");
  }

  if (toNumber(employee.horas_semanales_contratadas) <= 30) {
    traces.push("Empleado con jornada parcial o esquema turnero.");
  }

  return { rules, traces };
}

export function getMonthlyEquivalent(employee) {
  const base = toNumber(employee.salario_base);

  switch (employee.periodicidad_pago) {
    case "quincenal":
      return base * 2;
    case "semanal":
      return base * 4.333;
    case "diario":
      return base * 30;
    default:
      return base;
  }
}

export function getHourlyRate(employee) {
  const monthlyEquivalent = getMonthlyEquivalent(employee);
  const weeklyHours = Math.max(1, toNumber(employee.horas_semanales_contratadas || 46));
  const monthlyHours = weeklyHours * (30 / 6);
  return monthlyHours > 0 ? monthlyEquivalent / monthlyHours : 0;
}

export function prorateByPeriod(amount, periodType) {
  const safeAmount = toNumber(amount);

  switch (periodType) {
    case "diario":
      return safeAmount / 30;
    case "semanal":
      return safeAmount / 4.333;
    case "quincenal":
      return safeAmount / 2;
    default:
      return safeAmount;
  }
}

export function normalizeAttendanceLog(log, employee) {
  const { rules, traces } = resolveEmployeeRules(employee);

  const adjusted = {
    ordinary_hours: toNumber(log.ordinary_hours),
    extra_day_hours: toNumber(log.extra_day_hours),
    extra_night_hours: toNumber(log.extra_night_hours),
    night_surcharge_hours: toNumber(log.night_surcharge_hours),
    sunday_hours: toNumber(log.sunday_hours),
    festive_hours: toNumber(log.festive_hours),
    sunday_night_hours: toNumber(log.sunday_night_hours),
  };

  if (!rules.aplica_horas_extras) {
    adjusted.extra_day_hours = 0;
    adjusted.extra_night_hours = 0;
  }

  if (!rules.aplica_recargo_nocturno) {
    adjusted.night_surcharge_hours = 0;
  }

  if (!rules.aplica_recargo_dominical) {
    adjusted.sunday_hours = 0;
  }

  if (!rules.aplica_recargo_festivo) {
    adjusted.festive_hours = 0;
  }

  if (!rules.aplica_recargo_nocturno_dominical) {
    adjusted.sunday_night_hours = 0;
  }

  return { adjusted, traces };
}

function buildDetailMap(referenceDate) {
  const conceptCatalog = buildConceptCatalog(referenceDate);
  return new Map(conceptCatalog.map((concept) => [concept.key, concept]));
}

function toConceptValues(adjusted) {
  return {
    extraDay: adjusted.extra_day_hours,
    extraNight: adjusted.extra_night_hours,
    nightSurcharge: adjusted.night_surcharge_hours,
    sundayDaySurcharge: adjusted.sunday_hours + adjusted.festive_hours,
    sundayNightSurcharge: adjusted.sunday_night_hours,
    extraSundayDay: 0,
    extraSundayNight: 0,
  };
}

export function calculateEmployeePayroll(employee, attendanceLogs, payrollPeriod) {
  const hourlyRate = getHourlyRate(employee);
  const periodType = payrollPeriod?.period_type || "quincenal";
  const referenceDate = payrollPeriod?.end_date || CURRENT_DATE;
  const sundayRate = getSundayRate(referenceDate);
  const detailCatalog = buildDetailMap(referenceDate);
  const detailMap = new Map();
  const traces = [];

  attendanceLogs.forEach((log) => {
    const { adjusted, traces: entryTraces } = normalizeAttendanceLog(log, employee);
    entryTraces.forEach((trace) => traces.push(trace));
    const values = toConceptValues(adjusted);

    detailCatalog.forEach((concept, key) => {
      const quantity = toNumber(values[key]);

      if (!quantity) {
        return;
      }

      const current = detailMap.get(key) || {
        key,
        code: concept.short,
        label: concept.label,
        quantity: 0,
        multiplier: concept.multiplier,
        total: 0,
      };

      current.quantity += quantity;
      current.total += quantity * hourlyRate * concept.multiplier;
      detailMap.set(key, current);
    });
  });

  const details = Array.from(detailMap.values());
  const bonusesValue = prorateByPeriod(employee.bono_mensual, periodType);
  const transportValue = prorateByPeriod(employee.auxilio_transporte, periodType);
  const fixedDiscountsValue = prorateByPeriod(employee.descuentos_fijos, periodType);
  const baseSalaryValue = prorateByPeriod(getMonthlyEquivalent(employee), periodType);
  const overtimeValue = details
    .filter((detail) => detail.code.startsWith("HE"))
    .reduce((sum, detail) => sum + detail.total, 0);
  const surchargeValue = details
    .filter((detail) => !detail.code.startsWith("HE"))
    .reduce((sum, detail) => sum + detail.total, 0);
  const totalPay =
    baseSalaryValue +
    bonusesValue +
    transportValue +
    overtimeValue +
    surchargeValue -
    fixedDiscountsValue;

  traces.push(`Tarifa hora calculada: ${formatCurrency(hourlyRate)}.`);
  traces.push(`Recargo dominical de referencia: ${formatNumber(sundayRate * 100, 0)}%.`);
  traces.push(`Inicio nocturno de referencia: ${getNightShiftStartHour(referenceDate)}:00.`);

  return {
    employee_id: employee.id,
    hourly_rate: hourlyRate,
    base_salary_period: baseSalaryValue,
    bonuses_value: bonusesValue,
    transport_value: transportValue,
    discounts_value: fixedDiscountsValue,
    overtime_value: overtimeValue,
    surcharge_value: surchargeValue,
    total_pay: totalPay,
    details,
    traces,
    summary: {
      ordinary_hours: attendanceLogs.reduce((sum, log) => sum + toNumber(log.ordinary_hours), 0),
      extra_hours: details
        .filter((detail) => detail.code.startsWith("HE"))
        .reduce((sum, detail) => sum + detail.quantity, 0),
      surcharge_hours: details
        .filter((detail) => !detail.code.startsWith("HE"))
        .reduce((sum, detail) => sum + detail.quantity, 0),
    },
  };
}

export function calculatePeriodPayroll(employees, attendanceLogs, payrollPeriod) {
  return employees.map((employee) =>
    calculateEmployeePayroll(
      employee,
      attendanceLogs.filter((log) => log.employee_id === employee.id),
      payrollPeriod,
    ),
  );
}

export function buildPaySlip(employee, payrollPeriod, calculation) {
  return {
    employee_id: employee.id,
    employee_name: employee.nombre_completo,
    position: employee.cargo,
    phone: employee.telefono,
    period_label: payrollPeriod.label,
    base_salary_period: calculation.base_salary_period,
    bonus: calculation.bonuses_value,
    transport_allowance: calculation.transport_value,
    discounts: calculation.discounts_value,
    overtime_value: calculation.overtime_value,
    surcharge_value: calculation.surcharge_value,
    total_pay: calculation.total_pay,
    detail_lines: calculation.details,
  };
}
