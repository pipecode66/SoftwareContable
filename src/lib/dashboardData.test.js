import { describe, expect, it } from "vitest";
import {
  TODAY,
  createDemoState,
  getAttendanceState,
  getPayrollDashboard,
  upsertManualOvertime,
  upsertSpecialSchedule,
} from "./dashboardData";

function getEmployee(data, name) {
  return data.employees.find((employee) => employee.name === name);
}

describe("dashboardData schedule tools", () => {
  it("aplica un horario especial sobre la agenda base del día", () => {
    let data = createDemoState();
    const employee = getEmployee(data, "ARLEY GIL");

    data = upsertSpecialSchedule(data, {
      employeeId: employee.id,
      date: TODAY,
      mode: "custom",
      blocks: [{ start: "12:00", end: "18:00" }],
      notes: "Cobertura especial",
    });

    const state = getAttendanceState(employee, TODAY, data);

    expect(state.hasSpecialSchedule).toBe(true);
    expect(state.shiftBlocks).toEqual([{ start: "12:00", end: "18:00" }]);
  });

  it("suma horas extra manuales en la vista de nómina", () => {
    let data = createDemoState();
    const employee = getEmployee(data, "ARLEY GIL");
    const filters = {
      year: "2026",
      monthKey: "2026-03",
      employeeId: employee.id,
      position: "",
    };
    const before = getPayrollDashboard(data, filters);

    data = upsertManualOvertime(data, {
      employeeId: employee.id,
      date: TODAY,
      overtimeType: "extra_diurna",
      hours: 2,
      notes: "Cierre operativo",
    });

    const after = getPayrollDashboard(data, filters);

    expect(after.summary.overtimeHours).toBeGreaterThan(before.summary.overtimeHours);
    expect(after.summary.overtimeSpend).toBeGreaterThan(before.summary.overtimeSpend);
  });
});
