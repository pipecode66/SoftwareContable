import { createClient } from "@/src/lib/supabase/server";

type TableRow = any;

export type CompanyMembershipRow = any;

export type EmployeeWithRelations = any;

type LegalParameterRow = any;

export async function getCompany(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .is("deleted_at", null)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function listCompanyRows(
  table: string,
  companyId: string,
  orderBy = "created_at",
) {
  const supabase = await createClient();
  const softDeleteTables = new Set<string>([
    "companies",
    "company_users",
    "payroll_settings",
    "payroll_concepts",
    "payroll_concept_rules",
    "legal_parameters",
    "legal_parameter_versions",
    "positions",
    "departments",
    "employees",
    "employee_contracts",
    "employee_rule_overrides",
    "payroll_novelties",
    "overtime_records",
    "incapacity_records",
    "vacation_records",
    "attendance_adjustments",
    "additional_deductions",
    "payroll_simulations",
  ]);

  let query = supabase.from(table).select("*").eq("company_id", companyId);

  if (softDeleteTables.has(table)) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query.order(orderBy, { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as TableRow[];
}

export async function getPayrollSettings(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payroll_settings")
    .select("*")
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function listEmployees(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select(
      `
      *,
      employee_contracts(*),
      positions(id, name, code),
      departments(id, name, code)
    `,
    )
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as EmployeeWithRelations[];
}

export async function listLegalParameters(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("legal_parameters")
    .select("*, legal_parameter_versions(*)")
    .or(`company_id.eq.${companyId},is_global.eq.true`)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as LegalParameterRow[];
  return rows.map((row) => ({
    ...row,
    legal_parameter_versions: [...(row.legal_parameter_versions ?? [])].sort((left, right) =>
      left.valid_from > right.valid_from ? -1 : 1,
    ),
  }));
}

export async function getPayrollReadModel(companyId: string) {
  const [
    company,
    settings,
    employees,
    positions,
    departments,
    concepts,
    legalParameters,
    novelties,
    overtimeRecords,
    incapacityRecords,
    vacationRecords,
    attendanceAdjustments,
    additionalDeductions,
    simulations,
    auditLogs,
  ] = await Promise.all([
    getCompany(companyId),
    getPayrollSettings(companyId),
    listEmployees(companyId),
    listCompanyRows("positions", companyId, "name"),
    listCompanyRows("departments", companyId, "name"),
    listCompanyRows("payroll_concepts", companyId, "priority"),
    listLegalParameters(companyId),
    listCompanyRows("payroll_novelties", companyId, "date_start"),
    listCompanyRows("overtime_records", companyId, "work_date"),
    listCompanyRows("incapacity_records", companyId, "start_date"),
    listCompanyRows("vacation_records", companyId, "start_date"),
    listCompanyRows("attendance_adjustments", companyId, "adjustment_date"),
    listCompanyRows("additional_deductions", companyId, "applies_from"),
    listCompanyRows("payroll_simulations", companyId, "created_at"),
    listCompanyRows("payroll_audit_logs", companyId, "created_at"),
  ]);

  return {
    company,
    settings,
    employees,
    positions,
    departments,
    concepts,
    legalParameters,
    novelties,
    overtimeRecords,
    incapacityRecords,
    vacationRecords,
    attendanceAdjustments,
    additionalDeductions,
    simulations,
    auditLogs,
  };
}

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function keyByMonth(value: string) {
  return value.slice(0, 7);
}

function sumOvertimeHours(record: any) {
  return round(
    Number(record.extra_day_hours || 0) +
      Number(record.extra_night_hours || 0) +
      Number(record.night_surcharge_hours || 0) +
      Number(record.sunday_hours || 0) +
      Number(record.festive_hours || 0) +
      Number(record.sunday_night_hours || 0) +
      Number(record.extra_sunday_day_hours || 0) +
      Number(record.extra_sunday_night_hours || 0),
  );
}

export async function getPayrollOverview(companyId: string) {
  const readModel = await getPayrollReadModel(companyId);
  const currentMonth = new Date().toISOString().slice(0, 7);

  const monthlyOvertime = new Map<string, { hours: number; records: number }>();

  readModel.overtimeRecords.forEach((record) => {
    const monthKey = keyByMonth(record.work_date);
    const current = monthlyOvertime.get(monthKey) || { hours: 0, records: 0 };
    current.hours += sumOvertimeHours(record);
    current.records += 1;
    monthlyOvertime.set(monthKey, current);
  });

  const employeesByPosition = readModel.employees.reduce<Record<string, number>>((acc, employee) => {
    const key = employee.positions?.name || employee.full_name || "Sin cargo";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const currentMonthOvertime = readModel.overtimeRecords.filter(
    (item) => item.work_date.slice(0, 7) === currentMonth,
  );

  return {
    company: readModel.company,
    settings: readModel.settings,
    totals: {
      employees: readModel.employees.length,
      positions: readModel.positions.length,
      departments: readModel.departments.length,
      concepts: readModel.concepts.length,
      novelties: readModel.novelties.length,
      overtimeRecords: readModel.overtimeRecords.length,
      incapacityRecords: readModel.incapacityRecords.length,
      vacationRecords: readModel.vacationRecords.length,
      pendingSimulations: readModel.simulations.filter((item) => item.status === "draft").length,
      auditEvents: readModel.auditLogs.length,
      overtimeHoursCurrentMonth: round(
        currentMonthOvertime.reduce((total, item) => total + sumOvertimeHours(item), 0),
      ),
    },
    charts: {
      overtimeByMonth: Array.from(monthlyOvertime.entries())
        .map(([month, value]) => ({
          id: month,
          label: month,
          value: round(value.hours),
        }))
        .sort((left, right) => left.id.localeCompare(right.id)),
      employeesByPosition: Object.entries(employeesByPosition)
        .map(([label, value]) => ({ id: label, label, value }))
        .sort((left, right) => right.value - left.value),
    },
    readModel,
  };
}
