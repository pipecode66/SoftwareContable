create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'app_role'
  ) then
    create type public.app_role as enum (
      'super_admin',
      'company_admin',
      'payroll_analyst',
      'viewer'
    );
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  country_code text not null default 'CO',
  timezone text not null default 'America/Bogota',
  is_demo_template boolean not null default false,
  payroll_initialized boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create unique index if not exists companies_slug_active_idx
  on public.companies (slug)
  where deleted_at is null;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  is_demo boolean not null default false,
  default_company_id uuid references public.companies (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.company_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null default 'viewer',
  is_active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create unique index if not exists company_users_company_user_active_idx
  on public.company_users (company_id, user_id)
  where deleted_at is null;

create table if not exists public.payroll_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  country_code text not null default 'CO',
  payroll_frequency text not null default 'quincenal',
  overtime_enabled boolean not null default true,
  social_security_enabled boolean not null default true,
  parafiscals_enabled boolean not null default true,
  benefits_enabled boolean not null default true,
  transport_allowance_enabled boolean not null default true,
  daytime_start time not null default '06:00',
  daytime_end time not null default '21:00',
  night_start time not null default '21:00',
  weekly_max_hours numeric(10,2) not null default 46,
  config jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create unique index if not exists payroll_settings_company_active_idx
  on public.payroll_settings (company_id)
  where deleted_at is null;

create table if not exists public.payroll_concepts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  code text not null,
  name text not null,
  category text not null,
  subcategory text,
  type text not null default 'earning',
  is_active boolean not null default true,
  is_base_concept boolean not null default false,
  is_editable boolean not null default true,
  is_deletable boolean not null default true,
  salary_constitutive boolean not null default false,
  affects_health_ibc boolean not null default false,
  affects_pension_ibc boolean not null default false,
  affects_arl_ibc boolean not null default false,
  affects_parafiscals boolean not null default false,
  affects_severance boolean not null default false,
  affects_severance_interest boolean not null default false,
  affects_service_bonus boolean not null default false,
  affects_vacation_base boolean not null default false,
  requires_days boolean not null default false,
  requires_hours boolean not null default false,
  requires_amount boolean not null default true,
  auto_calculated boolean not null default false,
  formula_type text not null default 'manual',
  formula_config jsonb not null default '{}'::jsonb,
  priority integer not null default 100,
  rounding_mode text not null default 'half_up',
  applies_by_default boolean not null default true,
  valid_from date,
  valid_to date,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create unique index if not exists payroll_concepts_company_code_active_idx
  on public.payroll_concepts (company_id, code)
  where deleted_at is null;

create table if not exists public.payroll_concept_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  concept_id uuid not null references public.payroll_concepts (id) on delete cascade,
  target_level text not null default 'company',
  target_id uuid,
  condition_type text not null default 'always',
  condition_config jsonb not null default '{}'::jsonb,
  priority integer not null default 100,
  is_active boolean not null default true,
  valid_from date,
  valid_to date,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.legal_parameters (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies (id) on delete cascade,
  key text not null,
  name text not null,
  description text,
  value_type text not null default 'number',
  is_global boolean not null default false,
  can_company_override boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create unique index if not exists legal_parameters_company_key_active_idx
  on public.legal_parameters (coalesce(company_id, '00000000-0000-0000-0000-000000000000'::uuid), key)
  where deleted_at is null;

create table if not exists public.legal_parameter_versions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies (id) on delete cascade,
  legal_parameter_id uuid not null references public.legal_parameters (id) on delete cascade,
  value jsonb not null default '{}'::jsonb,
  version_label text,
  valid_from date not null,
  valid_to date,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create unique index if not exists legal_parameter_versions_active_idx
  on public.legal_parameter_versions (legal_parameter_id, valid_from)
  where deleted_at is null;

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  config jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create unique index if not exists positions_company_code_active_idx
  on public.positions (company_id, code)
  where deleted_at is null;

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  config jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create unique index if not exists departments_company_code_active_idx
  on public.departments (company_id, code)
  where deleted_at is null;

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  code text,
  first_name text not null,
  last_name text not null,
  full_name text not null,
  email text,
  phone text,
  document_type text not null default 'CC',
  document_number text not null,
  position_id uuid references public.positions (id) on delete set null,
  department_id uuid references public.departments (id) on delete set null,
  admission_date date not null,
  status text not null default 'active',
  base_salary numeric(14,2) not null default 0,
  hourly_value numeric(14,2),
  weekly_hours numeric(10,2) not null default 46,
  rest_day text,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create unique index if not exists employees_company_document_active_idx
  on public.employees (company_id, document_number)
  where deleted_at is null;

create table if not exists public.employee_contracts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  contract_type text not null,
  payment_frequency text not null default 'quincenal',
  salary_base numeric(14,2) not null default 0,
  transport_allowance numeric(14,2) not null default 0,
  bonus_amount numeric(14,2) not null default 0,
  commission_enabled boolean not null default false,
  social_security_enabled boolean not null default true,
  parafiscals_enabled boolean not null default true,
  benefits_enabled boolean not null default true,
  arl_risk_class integer,
  start_date date not null,
  end_date date,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create unique index if not exists employee_contracts_employee_active_idx
  on public.employee_contracts (employee_id)
  where deleted_at is null;

create table if not exists public.employee_rule_overrides (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  rule_key text not null,
  rule_value jsonb not null default '{}'::jsonb,
  priority integer not null default 500,
  valid_from date,
  valid_to date,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.payroll_novelties (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  novelty_type text not null,
  concept_id uuid references public.payroll_concepts (id) on delete set null,
  date_start date not null,
  date_end date not null,
  days numeric(10,2),
  hours numeric(10,2),
  amount numeric(14,2),
  impact_salary boolean not null default true,
  impact_benefits boolean not null default true,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.overtime_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  work_date date not null,
  ordinary_hours numeric(10,2) not null default 0,
  extra_day_hours numeric(10,2) not null default 0,
  extra_night_hours numeric(10,2) not null default 0,
  night_surcharge_hours numeric(10,2) not null default 0,
  sunday_hours numeric(10,2) not null default 0,
  festive_hours numeric(10,2) not null default 0,
  sunday_night_hours numeric(10,2) not null default 0,
  extra_sunday_day_hours numeric(10,2) not null default 0,
  extra_sunday_night_hours numeric(10,2) not null default 0,
  source text not null default 'manual',
  raw_payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.incapacity_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  incapacity_type text not null,
  origin text not null,
  start_date date not null,
  end_date date not null,
  days numeric(10,2) not null,
  payment_percentage numeric(10,2) not null,
  payer_responsible text not null,
  support_path text,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.vacation_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  record_type text not null,
  start_date date,
  end_date date,
  days numeric(10,2) not null default 0,
  enjoyed_days numeric(10,2) not null default 0,
  pending_days numeric(10,2) not null default 0,
  paid_amount numeric(14,2),
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.attendance_adjustments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  adjustment_date date not null,
  status text not null,
  expected_start time,
  actual_start time,
  late_hours numeric(10,2),
  impact_salary boolean not null default true,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.additional_deductions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  concept_name text not null,
  amount numeric(14,2) not null,
  recurrence text not null default 'one_off',
  applies_from date not null,
  applies_to date,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.payroll_simulations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  employee_id uuid references public.employees (id) on delete set null,
  period_start date not null,
  period_end date not null,
  status text not null default 'draft',
  filters jsonb not null default '{}'::jsonb,
  input_snapshot jsonb not null default '{}'::jsonb,
  result_snapshot jsonb not null default '{}'::jsonb,
  total_devengado numeric(14,2) not null default 0,
  total_deducciones numeric(14,2) not null default 0,
  neto_pagar numeric(14,2) not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.payroll_audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  module text not null,
  action text not null,
  field_name text,
  old_value jsonb,
  new_value jsonb,
  reason text,
  record_id uuid,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.demo_template_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_company_id uuid not null references public.companies (id) on delete cascade,
  module text not null,
  version_label text not null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists demo_template_snapshots_company_module_idx
  on public.demo_template_snapshots (source_company_id, module, version_label);

create index if not exists payroll_novelties_company_employee_idx
  on public.payroll_novelties (company_id, employee_id, date_start, date_end);

create index if not exists overtime_records_company_employee_idx
  on public.overtime_records (company_id, employee_id, work_date);

create index if not exists incapacity_records_company_employee_idx
  on public.incapacity_records (company_id, employee_id, start_date, end_date);

create index if not exists vacation_records_company_employee_idx
  on public.vacation_records (company_id, employee_id);

create index if not exists attendance_adjustments_company_employee_idx
  on public.attendance_adjustments (company_id, employee_id, adjustment_date);

create index if not exists additional_deductions_company_employee_idx
  on public.additional_deductions (company_id, employee_id, applies_from);

create index if not exists payroll_audit_logs_company_created_at_idx
  on public.payroll_audit_logs (company_id, created_at desc);

create trigger set_companies_updated_at
before update on public.companies
for each row execute procedure public.set_updated_at();

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create trigger set_company_users_updated_at
before update on public.company_users
for each row execute procedure public.set_updated_at();

create trigger set_payroll_settings_updated_at
before update on public.payroll_settings
for each row execute procedure public.set_updated_at();

create trigger set_payroll_concepts_updated_at
before update on public.payroll_concepts
for each row execute procedure public.set_updated_at();

create trigger set_payroll_concept_rules_updated_at
before update on public.payroll_concept_rules
for each row execute procedure public.set_updated_at();

create trigger set_legal_parameters_updated_at
before update on public.legal_parameters
for each row execute procedure public.set_updated_at();

create trigger set_legal_parameter_versions_updated_at
before update on public.legal_parameter_versions
for each row execute procedure public.set_updated_at();

create trigger set_positions_updated_at
before update on public.positions
for each row execute procedure public.set_updated_at();

create trigger set_departments_updated_at
before update on public.departments
for each row execute procedure public.set_updated_at();

create trigger set_employees_updated_at
before update on public.employees
for each row execute procedure public.set_updated_at();

create trigger set_employee_contracts_updated_at
before update on public.employee_contracts
for each row execute procedure public.set_updated_at();

create trigger set_employee_rule_overrides_updated_at
before update on public.employee_rule_overrides
for each row execute procedure public.set_updated_at();

create trigger set_payroll_novelties_updated_at
before update on public.payroll_novelties
for each row execute procedure public.set_updated_at();

create trigger set_overtime_records_updated_at
before update on public.overtime_records
for each row execute procedure public.set_updated_at();

create trigger set_incapacity_records_updated_at
before update on public.incapacity_records
for each row execute procedure public.set_updated_at();

create trigger set_vacation_records_updated_at
before update on public.vacation_records
for each row execute procedure public.set_updated_at();

create trigger set_attendance_adjustments_updated_at
before update on public.attendance_adjustments
for each row execute procedure public.set_updated_at();

create trigger set_additional_deductions_updated_at
before update on public.additional_deductions
for each row execute procedure public.set_updated_at();

create trigger set_payroll_simulations_updated_at
before update on public.payroll_simulations
for each row execute procedure public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payroll-supports',
  'payroll-supports',
  false,
  5242880,
  array['application/pdf', 'image/png', 'image/jpeg']
)
on conflict (id) do nothing;
