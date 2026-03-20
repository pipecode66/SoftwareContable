import { getSundayRate } from "@/src/lib/overtime";
import type { Database, Json } from "@/src/lib/supabase/types";
import type { EmployeeWithRelations } from "@/src/server/payroll/repository";

type LegalParameterRow = Database["public"]["Tables"]["legal_parameters"]["Row"] & {
  legal_parameter_versions: Database["public"]["Tables"]["legal_parameter_versions"]["Row"][];
};

type OvertimeRecord = Database["public"]["Tables"]["overtime_records"]["Row"];
type PayrollNovelty = Database["public"]["Tables"]["payroll_novelties"]["Row"];
type IncapacityRecord = Database["public"]["Tables"]["incapacity_records"]["Row"];
type VacationRecord = Database["public"]["Tables"]["vacation_records"]["Row"];
type AttendanceAdjustment = Database["public"]["Tables"]["attendance_adjustments"]["Row"];
type AdditionalDeduction = Database["public"]["Tables"]["additional_deductions"]["Row"];
type EmployeeRuleOverride = Database["public"]["Tables"]["employee_rule_overrides"]["Row"];
type PayrollSettings = Database["public"]["Tables"]["payroll_settings"]["Row"] | null;

export type SimulationLine = {
  code: string;
  label: string;
  category: string;
  quantity?: number;
  amount: number;
  metadata?: Json;
};

export type EmployeeSimulation = {
  employeeId: string;
  employeeName: string;
  periodStart: string;
  periodEnd: string;
  hourlyValue: number;
  baseSalary: number;
  lines: SimulationLine[];
  bases: {
    ibcHealth: number;
    ibcPension: number;
    ibcArl: number;
    parafiscals: number;
    benefits: number;
  };
  totals: {
    totalDevengado: number;
    totalDeducciones: number;
    netoPagar: number;
    employerCost: number;
  };
};

type SimulationInput = {
  employee: EmployeeWithRelations;
  settings: PayrollSettings;
  legalParameters: LegalParameterRow[];
  overtimeRecords: OvertimeRecord[];
  novelties: PayrollNovelty[];
  incapacityRecords: IncapacityRecord[];
  vacationRecords: VacationRecord[];
  attendanceAdjustments: AttendanceAdjustment[];
  additionalDeductions: AdditionalDeduction[];
  overrides?: EmployeeRuleOverride[];
  periodStart: string;
  periodEnd: string;
};

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function getDateInPeriod(dateValue: string, periodStart: string, periodEnd: string) {
  return dateValue >= periodStart && dateValue <= periodEnd;
}

function getLatestVersion(parameter: LegalParameterRow, referenceDate: string) {
  return [...(parameter.legal_parameter_versions ?? [])]
    .filter((version) => version.valid_from <= referenceDate && (!version.valid_to || version.valid_to >= referenceDate))
    .sort((left, right) => (left.valid_from > right.valid_from ? -1 : 1))[0];
}

function getParameterValue(
  parameters: LegalParameterRow[],
  key: string,
  referenceDate: string,
  fallback: number | Record<string, number> = 0,
) {
  const parameter = parameters.find((item) => item.key === key);
  const version = parameter ? getLatestVersion(parameter, referenceDate) : null;

  if (!version) {
    return fallback;
  }

  const raw = version.value as Record<string, number | string>;

  if ("rate" in raw && typeof raw.rate === "number") {
    return raw.rate;
  }

  if ("amount" in raw && typeof raw.amount === "number") {
    return raw.amount;
  }

  return raw as Record<string, number>;
}

function getOverrideFlag(overrides: EmployeeRuleOverride[] | undefined, key: string) {
  const override = overrides?.find((item) => item.rule_key === key);
  if (!override) {
    return null;
  }

  const value = override.rule_value as Record<string, unknown>;
  if (typeof value.enabled === "boolean") {
    return value.enabled;
  }
  if (typeof value.value === "boolean") {
    return value.value;
  }
  return null;
}

function sumOvertimeValue(
  hourlyValue: number,
  record: OvertimeRecord,
  legalParameters: LegalParameterRow[],
) {
  const rateDay = Number(getParameterValue(legalParameters, "hora_extra_diurna", record.work_date, 1.25));
  const rateNight = Number(getParameterValue(legalParameters, "hora_extra_nocturna", record.work_date, 1.75));
  const sundayRate = Number(getParameterValue(legalParameters, "dominical_festivo", record.work_date, getSundayRate(record.work_date)));
  const nightRate = Number(getParameterValue(legalParameters, "recargo_nocturno", record.work_date, 0.35));

  return {
    overtimeDay: round(Number(record.extra_day_hours || 0) * hourlyValue * rateDay),
    overtimeNight: round(Number(record.extra_night_hours || 0) * hourlyValue * rateNight),
    nightSurcharge: round(Number(record.night_surcharge_hours || 0) * hourlyValue * nightRate),
    sunday: round(Number(record.sunday_hours || 0) * hourlyValue * sundayRate),
    festive: round(Number(record.festive_hours || 0) * hourlyValue * sundayRate),
    sundayNight: round(Number(record.sunday_night_hours || 0) * hourlyValue * (sundayRate + nightRate)),
    overtimeSundayDay: round(Number(record.extra_sunday_day_hours || 0) * hourlyValue * (1.25 + sundayRate)),
    overtimeSundayNight: round(
      Number(record.extra_sunday_night_hours || 0) * hourlyValue * (1.75 + sundayRate),
    ),
  };
}

function getHourlyValue(employee: EmployeeWithRelations) {
  const activeContract = employee.employee_contracts.find((item: any) => !item.deleted_at) ?? null;
  const salaryBase = Number(activeContract?.salary_base || employee.base_salary || 0);
  const weeklyHours = Number(employee.weekly_hours || 46);
  const monthlyHours = Math.max(1, weeklyHours * 4.33);
  return round(salaryBase / monthlyHours);
}

function getBaseSalaryForPeriod(employee: EmployeeWithRelations) {
  const activeContract = employee.employee_contracts.find((item: any) => !item.deleted_at) ?? null;
  const paymentFrequency = activeContract?.payment_frequency || "quincenal";
  const salaryBase = Number(activeContract?.salary_base || employee.base_salary || 0);

  if (paymentFrequency === "semanal") {
    return round(salaryBase);
  }

  if (paymentFrequency === "mensual") {
    return round(salaryBase / 2);
  }

  return round(salaryBase);
}

function addLine(lines: SimulationLine[], line: SimulationLine) {
  if (!line.amount) {
    return;
  }
  lines.push(line);
}

export function calculateEmployeeSimulation(input: SimulationInput): EmployeeSimulation {
  const {
    employee,
    legalParameters,
    periodStart,
    periodEnd,
    overtimeRecords,
    novelties,
    incapacityRecords,
    vacationRecords,
    attendanceAdjustments,
    additionalDeductions,
    overrides,
  } = input;

  const hourlyValue = getHourlyValue(employee);
  const baseSalary = getBaseSalaryForPeriod(employee);
  const activeContract = employee.employee_contracts.find((item: any) => !item.deleted_at) ?? null;
  const transportAllowance = Number(activeContract?.transport_allowance || 0);
  const bonusAmount = Number(activeContract?.bonus_amount || 0);
  const salaryMinimum = Number(getParameterValue(legalParameters, "salario_minimo", periodEnd, 0));
  const transportLegal = Number(getParameterValue(legalParameters, "auxilio_transporte", periodEnd, transportAllowance));
  const healthEmployeeRate = Number(getParameterValue(legalParameters, "salud_empleado", periodEnd, 0.04));
  const healthEmployerRate = Number(getParameterValue(legalParameters, "salud_empleador", periodEnd, 0.085));
  const pensionEmployeeRate = Number(getParameterValue(legalParameters, "pension_empleado", periodEnd, 0.04));
  const pensionEmployerRate = Number(getParameterValue(legalParameters, "pension_empleador", periodEnd, 0.12));
  const solidarityConfig = getParameterValue(legalParameters, "fondo_solidaridad", periodEnd, {
    threshold_in_smlv: 4,
    rate: 0.01,
  }) as Record<string, number>;
  const arlRiskMap = getParameterValue(legalParameters, "arl_risk_classes", periodEnd, {
    class_1: 0.00522,
  }) as Record<string, number>;
  const cajaRate = Number(getParameterValue(legalParameters, "caja_compensacion", periodEnd, 0.04));
  const icbfRate = Number(getParameterValue(legalParameters, "icbf", periodEnd, 0.03));
  const senaRate = Number(getParameterValue(legalParameters, "sena", periodEnd, 0.02));
  const arlClass = Math.min(5, Math.max(1, Number(activeContract?.arl_risk_class || 1)));
  const arlRate = Number(arlRiskMap[`class_${arlClass}`] || arlRiskMap.class_1 || 0.00522);
  const appliesOvertime =
    getOverrideFlag(overrides, "aplica_horas_extras") ??
    !["manejo_confianza", "sin_contrato"].includes(activeContract?.contract_type || "");
  const appliesNight =
    getOverrideFlag(overrides, "aplica_recargo_nocturno") ??
    activeContract?.contract_type !== "sin_contrato";
  const appliesSunday =
    getOverrideFlag(overrides, "aplica_dominical") ??
    true;

  const scopedOvertime = overtimeRecords.filter((record) => getDateInPeriod(record.work_date, periodStart, periodEnd));
  const scopedNovelties = novelties.filter((record) =>
    record.date_start <= periodEnd && record.date_end >= periodStart,
  );
  const scopedIncapacities = incapacityRecords.filter((record) =>
    record.start_date <= periodEnd && record.end_date >= periodStart,
  );
  const scopedVacations = vacationRecords.filter((record) =>
    !record.start_date || getDateInPeriod(record.start_date, periodStart, periodEnd),
  );
  const scopedAttendance = attendanceAdjustments.filter((record) =>
    getDateInPeriod(record.adjustment_date, periodStart, periodEnd),
  );
  const scopedDeductions = additionalDeductions.filter((record) =>
    record.applies_from <= periodEnd && (!record.applies_to || record.applies_to >= periodStart),
  );

  const lines: SimulationLine[] = [];

  addLine(lines, {
    code: "SALARIO_BASICO",
    label: "Salario básico",
    category: "devengado",
    amount: baseSalary,
  });

  if (bonusAmount > 0) {
    addLine(lines, {
      code: "BONO_SALARIAL",
      label: "Bono",
      category: "devengado",
      amount: bonusAmount,
    });
  }

  if (transportAllowance > 0 || (salaryMinimum && activeContract?.salary_base && activeContract.salary_base <= salaryMinimum * 2)) {
    addLine(lines, {
      code: "AUX_TRANSPORTE",
      label: "Auxilio de transporte",
      category: "devengado_no_salarial",
      amount: transportAllowance || transportLegal,
    });
  }

  scopedOvertime.forEach((record) => {
    const breakdown = sumOvertimeValue(hourlyValue, record, legalParameters);

    if (appliesOvertime) {
      addLine(lines, {
        code: "HED",
        label: "Horas extras diurnas",
        category: "devengado",
        quantity: Number(record.extra_day_hours || 0),
        amount: breakdown.overtimeDay,
      });
      addLine(lines, {
        code: "HEN",
        label: "Horas extras nocturnas",
        category: "devengado",
        quantity: Number(record.extra_night_hours || 0),
        amount: breakdown.overtimeNight,
      });
      addLine(lines, {
        code: "HEDDF",
        label: "Hora extra diurna dominical/festiva",
        category: "devengado",
        quantity: Number(record.extra_sunday_day_hours || 0),
        amount: breakdown.overtimeSundayDay,
      });
      addLine(lines, {
        code: "HENDF",
        label: "Hora extra nocturna dominical/festiva",
        category: "devengado",
        quantity: Number(record.extra_sunday_night_hours || 0),
        amount: breakdown.overtimeSundayNight,
      });
    }

    if (appliesNight) {
      addLine(lines, {
        code: "RN",
        label: "Recargo nocturno",
        category: "devengado",
        quantity: Number(record.night_surcharge_hours || 0),
        amount: breakdown.nightSurcharge,
      });
    }

    if (appliesSunday) {
      addLine(lines, {
        code: "DOMFEST",
        label: "Dominicales y festivos",
        category: "devengado",
        quantity: Number(record.sunday_hours || 0) + Number(record.festive_hours || 0),
        amount: breakdown.sunday + breakdown.festive + breakdown.sundayNight,
      });
    }
  });

  scopedNovelties.forEach((novelty) => {
    addLine(lines, {
      code: novelty.novelty_type.toUpperCase(),
      label: novelty.novelty_type.replaceAll("_", " "),
      category: novelty.amount && novelty.amount < 0 ? "deduccion" : "devengado",
      quantity: Number(novelty.days || novelty.hours || 0),
      amount: Number(novelty.amount || 0),
      metadata: novelty.metadata,
    });
  });

  scopedIncapacities.forEach((record) => {
    const dayValue = baseSalary / 30;
    const amount = Number(record.days || 0) * dayValue * (Number(record.payment_percentage || 0) / 100);
    addLine(lines, {
      code: "INCAP",
      label: `Incapacidad ${record.incapacity_type}`,
      category: "devengado",
      quantity: Number(record.days || 0),
      amount,
      metadata: { origin: record.origin, payer: record.payer_responsible },
    });
  });

  scopedVacations.forEach((record) => {
    const amount =
      Number(record.paid_amount || 0) ||
      round((baseSalary / 30) * Number(record.days || record.enjoyed_days || 0));
    addLine(lines, {
      code: "VAC",
      label: `Vacaciones ${record.record_type}`,
      category: "devengado",
      quantity: Number(record.days || record.enjoyed_days || 0),
      amount,
    });
  });

  scopedAttendance.forEach((record) => {
    if (record.status === "late" && Number(record.late_hours || 0) > 0) {
      addLine(lines, {
        code: "ATRASO",
        label: "Descuento por atraso",
        category: "deduccion",
        quantity: Number(record.late_hours || 0),
        amount: round(Number(record.late_hours || 0) * hourlyValue * -1),
      });
    }

    if (record.status === "absent_unjustified") {
      addLine(lines, {
        code: "FALTA_NJ",
        label: "Falta no justificada",
        category: "deduccion",
        amount: round((baseSalary / 30) * -1),
      });
    }
  });

  scopedDeductions.forEach((record) => {
    addLine(lines, {
      code: "DESCUENTO_MANUAL",
      label: record.concept_name,
      category: "deduccion",
      amount: Number(record.amount || 0) * -1,
    });
  });

  const salarials = lines
    .filter((line) => ["devengado"].includes(line.category))
    .reduce((total, line) => total + line.amount, 0);
  const ibcHealth = round(salarials);
  const ibcPension = round(salarials);
  const ibcArl = round(salarials);
  const parafiscalBase = round(salarials);
  const benefitsBase = round(salarials);

  const solidarityThreshold = Number((solidarityConfig.threshold_in_smlv || 4) * salaryMinimum);
  const solidarityRate = ibcPension >= solidarityThreshold ? Number(solidarityConfig.rate || 0) : 0;

  addLine(lines, {
    code: "SALUD_EMPLEADO",
    label: "Salud empleado",
    category: "deduccion",
    amount: round(ibcHealth * healthEmployeeRate * -1),
  });
  addLine(lines, {
    code: "PENSION_EMPLEADO",
    label: "Pensión empleado",
    category: "deduccion",
    amount: round(ibcPension * pensionEmployeeRate * -1),
  });

  if (solidarityRate > 0) {
    addLine(lines, {
      code: "FSP",
      label: "Fondo de solidaridad",
      category: "deduccion",
      amount: round(ibcPension * solidarityRate * -1),
    });
  }

  addLine(lines, {
    code: "CESANTIAS",
    label: "Provisión cesantías",
    category: "empleador",
    amount: round(benefitsBase / 12),
  });
  addLine(lines, {
    code: "INT_CESANTIAS",
    label: "Intereses cesantías",
    category: "empleador",
    amount: round(benefitsBase * 0.12 / 12),
  });
  addLine(lines, {
    code: "PRIMA",
    label: "Provisión prima",
    category: "empleador",
    amount: round(benefitsBase / 12),
  });
  addLine(lines, {
    code: "VAC_CAUSADAS",
    label: "Provisión vacaciones",
    category: "empleador",
    amount: round(benefitsBase / 24),
  });
  addLine(lines, {
    code: "SALUD_EMPRESA",
    label: "Salud empleador",
    category: "empleador",
    amount: round(ibcHealth * healthEmployerRate),
  });
  addLine(lines, {
    code: "PENSION_EMPRESA",
    label: "Pensión empleador",
    category: "empleador",
    amount: round(ibcPension * pensionEmployerRate),
  });
  addLine(lines, {
    code: "ARL",
    label: "ARL",
    category: "empleador",
    amount: round(ibcArl * arlRate),
  });
  addLine(lines, {
    code: "CAJA_COMPENSACION",
    label: "Caja de compensación",
    category: "empleador",
    amount: round(parafiscalBase * cajaRate),
  });
  addLine(lines, {
    code: "ICBF",
    label: "ICBF",
    category: "empleador",
    amount: round(parafiscalBase * icbfRate),
  });
  addLine(lines, {
    code: "SENA",
    label: "SENA",
    category: "empleador",
    amount: round(parafiscalBase * senaRate),
  });

  const totalDevengado = round(
    lines
      .filter((line) => line.category === "devengado" || line.category === "devengado_no_salarial")
      .reduce((total, line) => total + line.amount, 0),
  );
  const totalDeducciones = round(
    Math.abs(
      lines
        .filter((line) => line.category === "deduccion")
        .reduce((total, line) => total + line.amount, 0),
    ),
  );
  const employerCost = round(
    lines.filter((line) => line.category === "empleador").reduce((total, line) => total + line.amount, 0),
  );

  return {
    employeeId: employee.id,
    employeeName: employee.full_name,
    periodStart,
    periodEnd,
    hourlyValue,
    baseSalary,
    lines,
    bases: {
      ibcHealth,
      ibcPension,
      ibcArl,
      parafiscals: parafiscalBase,
      benefits: benefitsBase,
    },
    totals: {
      totalDevengado,
      totalDeducciones,
      netoPagar: round(totalDevengado - totalDeducciones),
      employerCost,
    },
  };
}
