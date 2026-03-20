"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/src/lib/supabase/server";
import { requireAuth, requireCompanyContext } from "@/src/server/auth/context";
import { calculateEmployeeSimulation } from "@/src/server/payroll/calculator";
import { getPayrollReadModel, listCompanyRows, listEmployees } from "@/src/server/payroll/repository";
import {
  CUSTOM_SETUP_STEPS,
  DEFAULT_DEPARTMENTS,
  DEFAULT_LEGAL_PARAMETERS,
  DEFAULT_PAYROLL_CONCEPTS,
  DEFAULT_PAYROLL_SETTINGS,
  DEFAULT_POSITIONS,
} from "@/src/server/payroll/templates/defaults";

const companySchema = z.object({
  name: z.string().min(2),
});

const settingsSchema = z.object({
  payroll_frequency: z.string().min(3),
  weekly_max_hours: z.coerce.number().positive(),
  overtime_enabled: z.coerce.boolean().default(true),
  social_security_enabled: z.coerce.boolean().default(true),
  parafiscals_enabled: z.coerce.boolean().default(true),
  benefits_enabled: z.coerce.boolean().default(true),
  transport_allowance_enabled: z.coerce.boolean().default(true),
  daytime_start: z.string().min(4),
  daytime_end: z.string().min(4),
  night_start: z.string().min(4),
});

const employeeSchema = z.object({
  id: z.string().optional(),
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  document_number: z.string().min(5),
  document_type: z.string().min(2).default("CC"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  position_id: z.string().uuid().optional().or(z.literal("")),
  department_id: z.string().uuid().optional().or(z.literal("")),
  admission_date: z.string().min(10),
  base_salary: z.coerce.number().nonnegative(),
  weekly_hours: z.coerce.number().positive(),
  rest_day: z.string().optional(),
  status: z.string().min(3).default("active"),
  contract_type: z.string().min(3),
  payment_frequency: z.string().min(3),
  transport_allowance: z.coerce.number().nonnegative().default(0),
  bonus_amount: z.coerce.number().nonnegative().default(0),
  arl_risk_class: z.coerce.number().int().min(1).max(5).default(1),
});

const conceptSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  category: z.string().min(2),
  subcategory: z.string().optional(),
  type: z.string().min(2),
  salary_constitutive: z.coerce.boolean().default(false),
  requires_days: z.coerce.boolean().default(false),
  requires_hours: z.coerce.boolean().default(false),
  requires_amount: z.coerce.boolean().default(true),
});

const legalParameterSchema = z.object({
  key: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional(),
  value_type: z.string().min(2),
  valid_from: z.string().min(10),
  payload: z.string().min(2),
});

const simpleEntitySchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional(),
});

const noveltySchema = z.object({
  employee_id: z.string().uuid(),
  novelty_type: z.string().min(2),
  date_start: z.string().min(10),
  date_end: z.string().min(10),
  days: z.coerce.number().optional(),
  hours: z.coerce.number().optional(),
  amount: z.coerce.number().optional(),
  notes: z.string().optional(),
});

const overtimeSchema = z.object({
  employee_id: z.string().uuid(),
  work_date: z.string().min(10),
  extra_day_hours: z.coerce.number().default(0),
  extra_night_hours: z.coerce.number().default(0),
  night_surcharge_hours: z.coerce.number().default(0),
  sunday_hours: z.coerce.number().default(0),
  festive_hours: z.coerce.number().default(0),
  sunday_night_hours: z.coerce.number().default(0),
  extra_sunday_day_hours: z.coerce.number().default(0),
  extra_sunday_night_hours: z.coerce.number().default(0),
  source: z.string().default("manual"),
});

const incapacitySchema = z.object({
  employee_id: z.string().uuid(),
  incapacity_type: z.string().min(2),
  origin: z.string().min(2),
  start_date: z.string().min(10),
  end_date: z.string().min(10),
  days: z.coerce.number().positive(),
  payment_percentage: z.coerce.number().positive(),
  payer_responsible: z.string().min(2),
  notes: z.string().optional(),
});

const vacationSchema = z.object({
  employee_id: z.string().uuid(),
  record_type: z.string().min(2),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  days: z.coerce.number().nonnegative(),
  enjoyed_days: z.coerce.number().nonnegative().default(0),
  pending_days: z.coerce.number().nonnegative().default(0),
  paid_amount: z.coerce.number().nonnegative().optional(),
  notes: z.string().optional(),
});

const deductionSchema = z.object({
  employee_id: z.string().uuid(),
  concept_name: z.string().min(2),
  amount: z.coerce.number().positive(),
  recurrence: z.string().default("one_off"),
  applies_from: z.string().min(10),
  applies_to: z.string().optional(),
  notes: z.string().optional(),
});

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureManagerAccess() {
  const context = await requireCompanyContext();
  if (!["super_admin", "company_admin"].includes(context.activeRole || "")) {
    throw new Error("No tienes permisos para modificar la configuración de nómina.");
  }
  return context;
}

async function ensureOperatorAccess() {
  const context = await requireCompanyContext();
  if (!["super_admin", "company_admin", "payroll_analyst"].includes(context.activeRole || "")) {
    throw new Error("No tienes permisos para operar este módulo.");
  }
  return context;
}

async function writeAuditLog(
  companyId: string,
  userId: string,
  module: string,
  action: string,
  recordId?: string,
  newValue?: unknown,
  oldValue?: unknown,
  reason?: string,
) {
  const supabase = await createClient();
  await supabase.from("payroll_audit_logs").insert({
    company_id: companyId,
    user_id: userId,
    module,
    action,
    record_id: recordId || null,
    new_value: (newValue ?? null) as never,
    old_value: (oldValue ?? null) as never,
    reason: reason || null,
  });
}

export async function createCompanyAction(formData: FormData) {
  const auth = await requireAuth();
  const parsed = companySchema.parse({
    name: formData.get("name"),
  });

  const supabase = await createClient();
  const slugBase = slugify(parsed.name);
  const slug = `${slugBase}-${Date.now().toString().slice(-6)}`;
  const { data: company, error } = await supabase
    .from("companies")
    .insert({
      name: parsed.name,
      slug,
      created_by: auth.userId,
      updated_by: auth.userId,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await supabase.from("company_users").insert({
    company_id: company.id,
    user_id: auth.userId,
    role: "company_admin",
    created_by: auth.userId,
    updated_by: auth.userId,
  });

  await supabase.from("profiles").update({ default_company_id: company.id }).eq("id", auth.userId);

  await writeAuditLog(company.id, auth.userId, "companies", "create", company.id, company);
  revalidatePath("/setup/payroll");
  redirect("/setup/payroll");
}

export async function cloneDemoConfigAction() {
  const context = await ensureManagerAccess();
  const supabase = await createClient();
  const { error } = await supabase.rpc("clone_demo_payroll_config", {
    target_company_id: context.activeCompanyId!,
    actor_id: context.userId,
  });

  if (error) {
    throw error;
  }

  revalidatePath("/payroll");
  redirect("/payroll");
}

export async function initializeCustomPayrollAction(formData: FormData) {
  const context = await ensureManagerAccess();
  const supabase = await createClient();
  const overrides = settingsSchema.parse({
    payroll_frequency: formData.get("payroll_frequency") || DEFAULT_PAYROLL_SETTINGS.payroll_frequency,
    weekly_max_hours: formData.get("weekly_max_hours") || DEFAULT_PAYROLL_SETTINGS.weekly_max_hours,
    overtime_enabled: formData.get("overtime_enabled") === "on",
    social_security_enabled: formData.get("social_security_enabled") === "on",
    parafiscals_enabled: formData.get("parafiscals_enabled") === "on",
    benefits_enabled: formData.get("benefits_enabled") === "on",
    transport_allowance_enabled: formData.get("transport_allowance_enabled") === "on",
    daytime_start: formData.get("daytime_start") || DEFAULT_PAYROLL_SETTINGS.daytime_start,
    daytime_end: formData.get("daytime_end") || DEFAULT_PAYROLL_SETTINGS.daytime_end,
    night_start: formData.get("night_start") || DEFAULT_PAYROLL_SETTINGS.night_start,
  });

  const settingsPayload = {
    company_id: context.activeCompanyId!,
    ...DEFAULT_PAYROLL_SETTINGS,
    ...overrides,
    config: {
      setup_steps: CUSTOM_SETUP_STEPS,
      setup_mode: "custom",
    },
    created_by: context.userId,
    updated_by: context.userId,
  };

  const existingSettings = await supabase
    .from("payroll_settings")
    .select("id")
    .eq("company_id", context.activeCompanyId!)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingSettings.data?.id) {
    await supabase
      .from("payroll_settings")
      .update({
        ...settingsPayload,
        created_by: undefined,
      })
      .eq("id", existingSettings.data.id);
  } else {
    await supabase.from("payroll_settings").insert(settingsPayload);
  }

  const { data: concepts } = await supabase
    .from("payroll_concepts")
    .select("id, code")
    .eq("company_id", context.activeCompanyId!);

  if (!(concepts?.length ?? 0)) {
    await supabase.from("payroll_concepts").insert(
      DEFAULT_PAYROLL_CONCEPTS.map((concept) => ({
        ...concept,
        company_id: context.activeCompanyId!,
        created_by: context.userId,
        updated_by: context.userId,
      })),
    );
  }

  const [positions, departments, currentParameters] = await Promise.all([
    supabase.from("positions").select("id").eq("company_id", context.activeCompanyId!),
    supabase.from("departments").select("id").eq("company_id", context.activeCompanyId!),
    supabase.from("legal_parameters").select("id, key").eq("company_id", context.activeCompanyId!),
  ]);

  if (!(positions.data?.length ?? 0)) {
    await supabase.from("positions").insert(
      DEFAULT_POSITIONS.map((item) => ({
        ...item,
        company_id: context.activeCompanyId!,
        created_by: context.userId,
        updated_by: context.userId,
      })),
    );
  }

  if (!(departments.data?.length ?? 0)) {
    await supabase.from("departments").insert(
      DEFAULT_DEPARTMENTS.map((item) => ({
        ...item,
        company_id: context.activeCompanyId!,
        created_by: context.userId,
        updated_by: context.userId,
      })),
    );
  }

  if (!(currentParameters.data?.length ?? 0)) {
    for (const seed of DEFAULT_LEGAL_PARAMETERS) {
      const { data: parameter } = await supabase
        .from("legal_parameters")
        .insert({
          ...seed.parameter,
          company_id: context.activeCompanyId!,
          created_by: context.userId,
          updated_by: context.userId,
          is_global: false,
        })
        .select("id")
        .single();

      if (parameter) {
        await supabase.from("legal_parameter_versions").insert(
          seed.versions.map((version) => ({
            ...version,
            company_id: context.activeCompanyId!,
            legal_parameter_id: parameter.id,
            created_by: context.userId,
            updated_by: context.userId,
          })),
        );
      }
    }
  }

  await supabase
    .from("companies")
    .update({ payroll_initialized: true, updated_by: context.userId })
    .eq("id", context.activeCompanyId!);

  await writeAuditLog(
    context.activeCompanyId!,
    context.userId,
    "setup",
    "initialize_custom",
    context.activeCompanyId!,
    settingsPayload,
  );

  revalidatePath("/payroll");
  redirect("/payroll");
}

export async function resetDemoAction() {
  const context = await ensureManagerAccess();
  const supabase = await createClient();
  const { error } = await supabase.rpc("reset_demo_payroll_template", {
    actor_id: context.userId,
  });

  if (error) {
    throw error;
  }

  revalidatePath("/payroll");
  redirect("/payroll");
}

export async function upsertPayrollSettingsAction(formData: FormData) {
  const context = await ensureManagerAccess();
  const parsed = settingsSchema.parse({
    payroll_frequency: formData.get("payroll_frequency"),
    weekly_max_hours: formData.get("weekly_max_hours"),
    overtime_enabled: formData.get("overtime_enabled") === "on",
    social_security_enabled: formData.get("social_security_enabled") === "on",
    parafiscals_enabled: formData.get("parafiscals_enabled") === "on",
    benefits_enabled: formData.get("benefits_enabled") === "on",
    transport_allowance_enabled: formData.get("transport_allowance_enabled") === "on",
    daytime_start: formData.get("daytime_start"),
    daytime_end: formData.get("daytime_end"),
    night_start: formData.get("night_start"),
  });

  const supabase = await createClient();
  const current = await supabase
    .from("payroll_settings")
    .select("id")
    .eq("company_id", context.activeCompanyId!)
    .is("deleted_at", null)
    .maybeSingle();

  if (current.data?.id) {
    await supabase
      .from("payroll_settings")
      .update({
        ...parsed,
        updated_by: context.userId,
      })
      .eq("id", current.data.id);
  } else {
    await supabase.from("payroll_settings").insert({
      company_id: context.activeCompanyId!,
      ...parsed,
      created_by: context.userId,
      updated_by: context.userId,
    });
  }

  await writeAuditLog(context.activeCompanyId!, context.userId, "settings", "upsert", undefined, parsed);
  revalidatePath("/payroll/settings");
}

export async function createConceptAction(formData: FormData) {
  const context = await ensureManagerAccess();
  const parsed = conceptSchema.parse({
    code: formData.get("code"),
    name: formData.get("name"),
    category: formData.get("category"),
    subcategory: formData.get("subcategory"),
    type: formData.get("type"),
    salary_constitutive: formData.get("salary_constitutive") === "on",
    requires_days: formData.get("requires_days") === "on",
    requires_hours: formData.get("requires_hours") === "on",
    requires_amount: formData.get("requires_amount") !== "off",
  });

  const supabase = await createClient();
  await supabase.from("payroll_concepts").insert({
    company_id: context.activeCompanyId!,
    ...parsed,
    is_active: true,
    is_base_concept: false,
    is_editable: true,
    is_deletable: true,
    affects_health_ibc: parsed.salary_constitutive,
    affects_pension_ibc: parsed.salary_constitutive,
    affects_arl_ibc: parsed.salary_constitutive,
    affects_parafiscals: parsed.salary_constitutive,
    affects_severance: parsed.salary_constitutive,
    affects_severance_interest: parsed.salary_constitutive,
    affects_service_bonus: parsed.salary_constitutive,
    affects_vacation_base: parsed.salary_constitutive,
    auto_calculated: false,
    formula_type: "manual",
    formula_config: {},
    priority: 400,
    rounding_mode: "half_up",
    applies_by_default: true,
    created_by: context.userId,
    updated_by: context.userId,
  });

  await writeAuditLog(context.activeCompanyId!, context.userId, "concepts", "create", undefined, parsed);
  revalidatePath("/payroll/concepts");
}

export async function createLegalParameterAction(formData: FormData) {
  const context = await ensureManagerAccess();
  const parsed = legalParameterSchema.parse({
    key: formData.get("key"),
    name: formData.get("name"),
    description: formData.get("description"),
    value_type: formData.get("value_type"),
    valid_from: formData.get("valid_from"),
    payload: formData.get("payload"),
  });

  const supabase = await createClient();
  const existing = await supabase
    .from("legal_parameters")
    .select("id")
    .eq("company_id", context.activeCompanyId!)
    .eq("key", parsed.key)
    .is("deleted_at", null)
    .maybeSingle();

  let parameterId = existing.data?.id ?? null;

  if (parameterId) {
    await supabase
      .from("legal_parameters")
      .update({
        name: parsed.name,
        description: parsed.description || null,
        value_type: parsed.value_type,
        updated_by: context.userId,
      })
      .eq("id", parameterId);
  } else {
    const created = await supabase
      .from("legal_parameters")
      .insert({
        company_id: context.activeCompanyId!,
        key: parsed.key,
        name: parsed.name,
        description: parsed.description || null,
        value_type: parsed.value_type,
        is_global: false,
        can_company_override: true,
        created_by: context.userId,
        updated_by: context.userId,
      })
      .select("id")
      .single();

    parameterId = created.data?.id ?? null;
  }

  if (!parameterId) {
    throw new Error("No se pudo crear el parámetro legal.");
  }

  await supabase.from("legal_parameter_versions").insert({
    company_id: context.activeCompanyId!,
    legal_parameter_id: parameterId,
    value: JSON.parse(parsed.payload),
    version_label: parsed.valid_from.slice(0, 4),
    valid_from: parsed.valid_from,
    created_by: context.userId,
    updated_by: context.userId,
  });

  await writeAuditLog(context.activeCompanyId!, context.userId, "legal_parameters", "create", parameterId, parsed);
  revalidatePath("/payroll/legal-parameters");
}

async function upsertSimpleEntity(
  formData: FormData,
  table: "positions" | "departments",
  path: string,
) {
  const context = await ensureManagerAccess();
  const parsed = simpleEntitySchema.parse({
    id: formData.get("id") || undefined,
    code: formData.get("code"),
    name: formData.get("name"),
    description: formData.get("description"),
  });

  const supabase = await createClient();
  await supabase.from(table).upsert({
    ...parsed,
    company_id: context.activeCompanyId!,
    created_by: context.userId,
    updated_by: context.userId,
  });

  await writeAuditLog(context.activeCompanyId!, context.userId, table, parsed.id ? "update" : "create", parsed.id, parsed);
  revalidatePath(path);
}

export async function upsertPositionAction(formData: FormData) {
  await upsertSimpleEntity(formData, "positions", "/payroll/positions");
}

export async function upsertDepartmentAction(formData: FormData) {
  await upsertSimpleEntity(formData, "departments", "/payroll/departments");
}

async function softDeleteEntity(table: "positions" | "departments" | "employees", id: string, path: string) {
  const context = await ensureManagerAccess();
  const supabase = await createClient();
  await supabase
    .from(table)
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: context.userId,
    } as never)
    .eq("id", id)
    .eq("company_id", context.activeCompanyId!);

  await writeAuditLog(context.activeCompanyId!, context.userId, table, "delete", id);
  revalidatePath(path);
}

export async function deletePositionAction(formData: FormData) {
  await softDeleteEntity("positions", String(formData.get("id") || ""), "/payroll/positions");
}

export async function deleteDepartmentAction(formData: FormData) {
  await softDeleteEntity("departments", String(formData.get("id") || ""), "/payroll/departments");
}

export async function upsertEmployeeAction(formData: FormData) {
  const context = await ensureOperatorAccess();
  const parsed = employeeSchema.parse({
    id: formData.get("id") || undefined,
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    document_number: formData.get("document_number"),
    document_type: formData.get("document_type") || "CC",
    phone: formData.get("phone") || "",
    email: formData.get("email") || "",
    position_id: formData.get("position_id") || "",
    department_id: formData.get("department_id") || "",
    admission_date: formData.get("admission_date"),
    base_salary: formData.get("base_salary"),
    weekly_hours: formData.get("weekly_hours"),
    rest_day: formData.get("rest_day") || "",
    status: formData.get("status") || "active",
    contract_type: formData.get("contract_type"),
    payment_frequency: formData.get("payment_frequency"),
    transport_allowance: formData.get("transport_allowance") || 0,
    bonus_amount: formData.get("bonus_amount") || 0,
    arl_risk_class: formData.get("arl_risk_class") || 1,
  });

  const supabase = await createClient();
  const full_name = `${parsed.first_name} ${parsed.last_name}`.trim();
  const employeePayload = {
    id: parsed.id,
    company_id: context.activeCompanyId!,
    first_name: parsed.first_name,
    last_name: parsed.last_name,
    full_name,
    document_number: parsed.document_number,
    document_type: parsed.document_type,
    phone: parsed.phone || null,
    email: parsed.email || null,
    position_id: parsed.position_id || null,
    department_id: parsed.department_id || null,
    admission_date: parsed.admission_date,
    base_salary: parsed.base_salary,
    weekly_hours: parsed.weekly_hours,
    hourly_value: parsed.weekly_hours ? Math.round(parsed.base_salary / (parsed.weekly_hours * 4.33)) : 0,
    rest_day: parsed.rest_day || null,
    status: parsed.status,
    updated_by: context.userId,
    created_by: context.userId,
  };

  const { data: employee, error } = await supabase
    .from("employees")
    .upsert(employeePayload)
    .select("id")
    .single();

  if (error || !employee) {
    throw error || new Error("No se pudo guardar el empleado.");
  }

  const contracts = await supabase
    .from("employee_contracts")
    .select("id")
    .eq("employee_id", employee.id)
    .is("deleted_at", null)
    .maybeSingle();

  const contractPayload = {
    id: contracts.data?.id,
    company_id: context.activeCompanyId!,
    employee_id: employee.id,
    contract_type: parsed.contract_type,
    payment_frequency: parsed.payment_frequency,
    salary_base: parsed.base_salary,
    transport_allowance: parsed.transport_allowance,
    bonus_amount: parsed.bonus_amount,
    arl_risk_class: parsed.arl_risk_class,
    start_date: parsed.admission_date,
    created_by: context.userId,
    updated_by: context.userId,
  };

  await supabase.from("employee_contracts").upsert(contractPayload);
  await writeAuditLog(context.activeCompanyId!, context.userId, "employees", parsed.id ? "update" : "create", employee.id, employeePayload);
  revalidatePath("/payroll/employees");
}

export async function deleteEmployeeAction(formData: FormData) {
  await softDeleteEntity("employees", String(formData.get("id") || ""), "/payroll/employees");
}

export async function createNoveltyAction(formData: FormData) {
  const context = await ensureOperatorAccess();
  const parsed = noveltySchema.parse({
    employee_id: formData.get("employee_id"),
    novelty_type: formData.get("novelty_type"),
    date_start: formData.get("date_start"),
    date_end: formData.get("date_end"),
    days: formData.get("days") || undefined,
    hours: formData.get("hours") || undefined,
    amount: formData.get("amount") || undefined,
    notes: formData.get("notes") || "",
  });

  const supabase = await createClient();
  await supabase.from("payroll_novelties").insert({
    company_id: context.activeCompanyId!,
    ...parsed,
    notes: parsed.notes || null,
    created_by: context.userId,
    updated_by: context.userId,
  });

  await writeAuditLog(context.activeCompanyId!, context.userId, "novelties", "create", undefined, parsed);
  revalidatePath("/payroll/novelties");
}

export async function createOvertimeRecordAction(formData: FormData) {
  const context = await ensureOperatorAccess();
  const parsed = overtimeSchema.parse({
    employee_id: formData.get("employee_id"),
    work_date: formData.get("work_date"),
    extra_day_hours: formData.get("extra_day_hours") || 0,
    extra_night_hours: formData.get("extra_night_hours") || 0,
    night_surcharge_hours: formData.get("night_surcharge_hours") || 0,
    sunday_hours: formData.get("sunday_hours") || 0,
    festive_hours: formData.get("festive_hours") || 0,
    sunday_night_hours: formData.get("sunday_night_hours") || 0,
    extra_sunday_day_hours: formData.get("extra_sunday_day_hours") || 0,
    extra_sunday_night_hours: formData.get("extra_sunday_night_hours") || 0,
    source: formData.get("source") || "manual",
  });

  const supabase = await createClient();
  await supabase.from("overtime_records").insert({
    company_id: context.activeCompanyId!,
    ordinary_hours: 0,
    ...parsed,
    raw_payload: {},
    created_by: context.userId,
    updated_by: context.userId,
  });

  await writeAuditLog(context.activeCompanyId!, context.userId, "overtime", "create", undefined, parsed);
  revalidatePath("/payroll/overtime");
  revalidatePath("/payroll");
}

export async function createIncapacityAction(formData: FormData) {
  const context = await ensureOperatorAccess();
  const parsed = incapacitySchema.parse({
    employee_id: formData.get("employee_id"),
    incapacity_type: formData.get("incapacity_type"),
    origin: formData.get("origin"),
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date"),
    days: formData.get("days"),
    payment_percentage: formData.get("payment_percentage"),
    payer_responsible: formData.get("payer_responsible"),
    notes: formData.get("notes") || "",
  });

  const supabase = await createClient();
  await supabase.from("incapacity_records").insert({
    company_id: context.activeCompanyId!,
    ...parsed,
    notes: parsed.notes || null,
    created_by: context.userId,
    updated_by: context.userId,
  });

  await writeAuditLog(context.activeCompanyId!, context.userId, "incapacities", "create", undefined, parsed);
  revalidatePath("/payroll/incapacities");
}

export async function createVacationAction(formData: FormData) {
  const context = await ensureOperatorAccess();
  const parsed = vacationSchema.parse({
    employee_id: formData.get("employee_id"),
    record_type: formData.get("record_type"),
    start_date: String(formData.get("start_date") || "") || undefined,
    end_date: String(formData.get("end_date") || "") || undefined,
    days: formData.get("days") || 0,
    enjoyed_days: formData.get("enjoyed_days") || 0,
    pending_days: formData.get("pending_days") || 0,
    paid_amount: formData.get("paid_amount") || undefined,
    notes: formData.get("notes") || "",
  });

  const supabase = await createClient();
  await supabase.from("vacation_records").insert({
    company_id: context.activeCompanyId!,
    ...parsed,
    notes: parsed.notes || null,
    start_date: parsed.start_date || null,
    end_date: parsed.end_date || null,
    paid_amount: parsed.paid_amount ?? null,
    created_by: context.userId,
    updated_by: context.userId,
  });

  await writeAuditLog(context.activeCompanyId!, context.userId, "vacations", "create", undefined, parsed);
  revalidatePath("/payroll/vacations");
}

export async function createDeductionAction(formData: FormData) {
  const context = await ensureOperatorAccess();
  const parsed = deductionSchema.parse({
    employee_id: formData.get("employee_id"),
    concept_name: formData.get("concept_name"),
    amount: formData.get("amount"),
    recurrence: formData.get("recurrence") || "one_off",
    applies_from: formData.get("applies_from"),
    applies_to: String(formData.get("applies_to") || "") || undefined,
    notes: formData.get("notes") || "",
  });

  const supabase = await createClient();
  await supabase.from("additional_deductions").insert({
    company_id: context.activeCompanyId!,
    ...parsed,
    applies_to: parsed.applies_to || null,
    notes: parsed.notes || null,
    created_by: context.userId,
    updated_by: context.userId,
  });

  await writeAuditLog(context.activeCompanyId!, context.userId, "deductions", "create", undefined, parsed);
  revalidatePath("/payroll/deductions");
}

export async function runSimulationAction(formData: FormData) {
  const context = await ensureOperatorAccess();
  const employeeId = String(formData.get("employee_id") || "");
  const periodStart = String(formData.get("period_start") || "");
  const periodEnd = String(formData.get("period_end") || "");

  const [readModel, employees, overrides] = await Promise.all([
    getPayrollReadModel(context.activeCompanyId!),
    listEmployees(context.activeCompanyId!),
    listCompanyRows("employee_rule_overrides", context.activeCompanyId!, "priority"),
  ]);

  const targetEmployees = employeeId ? employees.filter((item) => item.id === employeeId) : employees;

  const results = targetEmployees.map((employee) =>
    calculateEmployeeSimulation({
      employee,
      settings: readModel.settings,
      legalParameters: readModel.legalParameters,
      overtimeRecords: readModel.overtimeRecords.filter((item) => item.employee_id === employee.id),
      novelties: readModel.novelties.filter((item) => item.employee_id === employee.id),
      incapacityRecords: readModel.incapacityRecords.filter((item) => item.employee_id === employee.id),
      vacationRecords: readModel.vacationRecords.filter((item) => item.employee_id === employee.id),
      attendanceAdjustments: readModel.attendanceAdjustments.filter((item) => item.employee_id === employee.id),
      additionalDeductions: readModel.additionalDeductions.filter((item) => item.employee_id === employee.id),
      overrides: overrides.filter((item) => item.employee_id === employee.id),
      periodStart,
      periodEnd,
    }),
  );

  const supabase = await createClient();

  await supabase.from("payroll_simulations").insert(
    results.map((result) => ({
      company_id: context.activeCompanyId!,
      employee_id: result.employeeId,
      period_start: periodStart,
      period_end: periodEnd,
      status: "generated",
      filters: { employee_id: employeeId || null },
      input_snapshot: {
        periodStart,
        periodEnd,
      },
      result_snapshot: result,
      total_devengado: result.totals.totalDevengado,
      total_deducciones: result.totals.totalDeducciones,
      neto_pagar: result.totals.netoPagar,
      created_by: context.userId,
      updated_by: context.userId,
    })),
  );

  await writeAuditLog(context.activeCompanyId!, context.userId, "simulator", "run", undefined, {
    periodStart,
    periodEnd,
    employees: targetEmployees.length,
  });

  revalidatePath("/payroll/simulator");
}
