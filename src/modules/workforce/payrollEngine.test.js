import { describe, expect, it } from "vitest";
import { createSeedDatabase } from "./data";
import {
  calculateEmployeePayroll,
  getHourlyRate,
  resolveEmployeeRules,
} from "./payrollEngine";

function getEmployee(database, name) {
  return database.employees.find((employee) => employee.nombre_completo === name);
}

describe("payrollEngine", () => {
  it("bloquea horas extras para cargos de manejo y confianza", () => {
    const database = createSeedDatabase();
    const heiner = getEmployee(database, "HEINER BARÓN");
    const period = database.payroll_periods[1];
    const logs = [
      {
        employee_id: heiner.id,
        ordinary_hours: 8,
        extra_day_hours: 3,
        extra_night_hours: 2,
        night_surcharge_hours: 2,
        sunday_hours: 1,
        festive_hours: 0,
        sunday_night_hours: 0,
      },
    ];

    const { rules } = resolveEmployeeRules(heiner);
    const calculation = calculateEmployeePayroll(heiner, logs, period);

    expect(rules.aplica_horas_extras).toBe(false);
    expect(calculation.summary.extra_hours).toBe(0);
    expect(calculation.summary.surcharge_hours).toBeGreaterThan(0);
  });

  it("anula extras y nocturnos para personal sin contrato pero conserva dominicales", () => {
    const database = createSeedDatabase();
    const david = getEmployee(database, "DAVID");
    const period = database.payroll_periods[1];
    const logs = [
      {
        employee_id: david.id,
        ordinary_hours: 8,
        extra_day_hours: 2,
        extra_night_hours: 1,
        night_surcharge_hours: 4,
        sunday_hours: 3,
        festive_hours: 1,
        sunday_night_hours: 1,
      },
    ];

    const calculation = calculateEmployeePayroll(david, logs, period);
    const dominicalDetail = calculation.details.find((detail) => detail.code === "DF");

    expect(calculation.summary.extra_hours).toBe(0);
    expect(calculation.details.some((detail) => detail.code === "RN")).toBe(false);
    expect(dominicalDetail?.quantity).toBe(4);
  });

  it("calcula tarifa hora consistente para turneros de 30 horas", () => {
    const database = createSeedDatabase();
    const dara = getEmployee(database, "DARA");
    const period = database.payroll_periods[1];
    const calculation = calculateEmployeePayroll(
      dara,
      database.attendance_logs.filter((entry) => entry.employee_id === dara.id),
      period,
    );

    expect(getHourlyRate(dara)).toBeGreaterThan(0);
    expect(calculation.traces.some((trace) => trace.includes("jornada parcial"))).toBe(true);
  });
});
