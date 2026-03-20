create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_users
    where user_id = auth.uid()
      and role = 'super_admin'
      and is_active = true
      and deleted_at is null
  );
$$;

create or replace function public.has_company_role(target_company_id uuid, allowed_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_super_admin()
    or exists (
      select 1
      from public.company_users
      where company_id = target_company_id
        and user_id = auth.uid()
        and role = any(allowed_roles)
        and is_active = true
        and deleted_at is null
    );
$$;

create or replace function public.can_view_company(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_company_role(
    target_company_id,
    array['super_admin', 'company_admin', 'payroll_analyst', 'viewer']::public.app_role[]
  );
$$;

create or replace function public.can_manage_company(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_company_role(
    target_company_id,
    array['super_admin', 'company_admin']::public.app_role[]
  );
$$;

create or replace function public.can_operate_payroll(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_company_role(
    target_company_id,
    array['super_admin', 'company_admin', 'payroll_analyst']::public.app_role[]
  );
$$;

create or replace function public.insert_payroll_audit_log(
  target_company_id uuid,
  actor_id uuid,
  target_module text,
  target_action text,
  target_record_id uuid default null,
  target_new_value jsonb default null,
  target_old_value jsonb default null,
  target_reason text default null
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.payroll_audit_logs (
    company_id,
    user_id,
    module,
    action,
    record_id,
    new_value,
    old_value,
    reason
  )
  values (
    target_company_id,
    actor_id,
    target_module,
    target_action,
    target_record_id,
    target_new_value,
    target_old_value,
    target_reason
  );
$$;

create or replace function public.get_demo_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.companies
  where is_demo_template = true
    and deleted_at is null
  order by created_at asc
  limit 1;
$$;

create or replace function public.clone_demo_payroll_config(
  target_company_id uuid,
  actor_id uuid default auth.uid()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  demo_company_id uuid;
  rec record;
  new_id uuid;
  mapped_id uuid;
  target_initialized boolean;
begin
  if target_company_id is null then
    raise exception 'target_company_id es obligatorio';
  end if;

  demo_company_id := public.get_demo_company_id();

  if demo_company_id is null then
    raise exception 'No existe empresa demo para clonar';
  end if;

  if target_company_id = demo_company_id then
    return jsonb_build_object('ok', true, 'message', 'La empresa demo ya está inicializada');
  end if;

  select payroll_initialized
  into target_initialized
  from public.companies
  where id = target_company_id;

  if coalesce(target_initialized, false) then
    raise exception 'La empresa ya fue inicializada';
  end if;

  create temporary table tmp_concept_map (
    old_id uuid,
    new_id uuid
  ) on commit drop;

  create temporary table tmp_parameter_map (
    old_id uuid,
    new_id uuid
  ) on commit drop;

  insert into public.payroll_settings (
    company_id,
    country_code,
    payroll_frequency,
    overtime_enabled,
    social_security_enabled,
    parafiscals_enabled,
    benefits_enabled,
    transport_allowance_enabled,
    daytime_start,
    daytime_end,
    night_start,
    weekly_max_hours,
    config,
    created_by,
    updated_by
  )
  select
    target_company_id,
    country_code,
    payroll_frequency,
    overtime_enabled,
    social_security_enabled,
    parafiscals_enabled,
    benefits_enabled,
    transport_allowance_enabled,
    daytime_start,
    daytime_end,
    night_start,
    weekly_max_hours,
    config,
    actor_id,
    actor_id
  from public.payroll_settings
  where company_id = demo_company_id
    and deleted_at is null
    and not exists (
      select 1
      from public.payroll_settings target
      where target.company_id = target_company_id
        and target.deleted_at is null
    );

  for rec in
    select *
    from public.positions
    where company_id = demo_company_id
      and deleted_at is null
  loop
    insert into public.positions (
      company_id,
      code,
      name,
      description,
      config,
      created_by,
      updated_by
    )
    values (
      target_company_id,
      rec.code,
      rec.name,
      rec.description,
      rec.config,
      actor_id,
      actor_id
    );
  end loop;

  for rec in
    select *
    from public.departments
    where company_id = demo_company_id
      and deleted_at is null
  loop
    insert into public.departments (
      company_id,
      code,
      name,
      description,
      config,
      created_by,
      updated_by
    )
    values (
      target_company_id,
      rec.code,
      rec.name,
      rec.description,
      rec.config,
      actor_id,
      actor_id
    );
  end loop;

  for rec in
    select *
    from public.payroll_concepts
    where company_id = demo_company_id
      and deleted_at is null
  loop
    insert into public.payroll_concepts (
      company_id,
      code,
      name,
      category,
      subcategory,
      type,
      is_active,
      is_base_concept,
      is_editable,
      is_deletable,
      salary_constitutive,
      affects_health_ibc,
      affects_pension_ibc,
      affects_arl_ibc,
      affects_parafiscals,
      affects_severance,
      affects_severance_interest,
      affects_service_bonus,
      affects_vacation_base,
      requires_days,
      requires_hours,
      requires_amount,
      auto_calculated,
      formula_type,
      formula_config,
      priority,
      rounding_mode,
      applies_by_default,
      valid_from,
      valid_to,
      created_by,
      updated_by
    )
    values (
      target_company_id,
      rec.code,
      rec.name,
      rec.category,
      rec.subcategory,
      rec.type,
      rec.is_active,
      rec.is_base_concept,
      rec.is_editable,
      rec.is_deletable,
      rec.salary_constitutive,
      rec.affects_health_ibc,
      rec.affects_pension_ibc,
      rec.affects_arl_ibc,
      rec.affects_parafiscals,
      rec.affects_severance,
      rec.affects_severance_interest,
      rec.affects_service_bonus,
      rec.affects_vacation_base,
      rec.requires_days,
      rec.requires_hours,
      rec.requires_amount,
      rec.auto_calculated,
      rec.formula_type,
      rec.formula_config,
      rec.priority,
      rec.rounding_mode,
      rec.applies_by_default,
      rec.valid_from,
      rec.valid_to,
      actor_id,
      actor_id
    )
    returning id into new_id;

    insert into tmp_concept_map values (rec.id, new_id);
  end loop;

  for rec in
    select *
    from public.payroll_concept_rules
    where company_id = demo_company_id
      and deleted_at is null
  loop
    select new_id
    into mapped_id
    from tmp_concept_map
    where old_id = rec.concept_id;

    insert into public.payroll_concept_rules (
      company_id,
      concept_id,
      target_level,
      target_id,
      condition_type,
      condition_config,
      priority,
      is_active,
      valid_from,
      valid_to,
      created_by,
      updated_by
    )
    values (
      target_company_id,
      mapped_id,
      rec.target_level,
      rec.target_id,
      rec.condition_type,
      rec.condition_config,
      rec.priority,
      rec.is_active,
      rec.valid_from,
      rec.valid_to,
      actor_id,
      actor_id
    );
  end loop;

  for rec in
    select *
    from public.legal_parameters
    where company_id = demo_company_id
      and deleted_at is null
  loop
    insert into public.legal_parameters (
      company_id,
      key,
      name,
      description,
      value_type,
      is_global,
      can_company_override,
      created_by,
      updated_by
    )
    values (
      target_company_id,
      rec.key,
      rec.name,
      rec.description,
      rec.value_type,
      false,
      rec.can_company_override,
      actor_id,
      actor_id
    )
    returning id into new_id;

    insert into tmp_parameter_map values (rec.id, new_id);
  end loop;

  for rec in
    select *
    from public.legal_parameter_versions
    where company_id = demo_company_id
      and deleted_at is null
  loop
    select new_id
    into mapped_id
    from tmp_parameter_map
    where old_id = rec.legal_parameter_id;

    insert into public.legal_parameter_versions (
      company_id,
      legal_parameter_id,
      value,
      version_label,
      valid_from,
      valid_to,
      created_by,
      updated_by
    )
    values (
      target_company_id,
      mapped_id,
      rec.value,
      rec.version_label,
      rec.valid_from,
      rec.valid_to,
      actor_id,
      actor_id
    );
  end loop;

  update public.companies
  set payroll_initialized = true,
      updated_by = actor_id
  where id = target_company_id;

  perform public.insert_payroll_audit_log(
    target_company_id,
    actor_id,
    'setup',
    'clone_demo',
    target_company_id,
    jsonb_build_object('source_company_id', demo_company_id),
    null,
    'Clonación inicial desde la cuenta demo'
  );

  return jsonb_build_object(
    'ok', true,
    'target_company_id', target_company_id,
    'source_company_id', demo_company_id
  );
end;
$$;

create or replace function public.reset_demo_payroll_template(
  actor_id uuid default auth.uid()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  demo_company_id uuid;
begin
  demo_company_id := public.get_demo_company_id();

  if demo_company_id is null then
    raise exception 'No existe empresa demo para restaurar';
  end if;

  delete from public.employee_rule_overrides where company_id = demo_company_id;
  delete from public.employee_contracts where company_id = demo_company_id;
  delete from public.overtime_records where company_id = demo_company_id;
  delete from public.payroll_novelties where company_id = demo_company_id;
  delete from public.incapacity_records where company_id = demo_company_id;
  delete from public.vacation_records where company_id = demo_company_id;
  delete from public.attendance_adjustments where company_id = demo_company_id;
  delete from public.additional_deductions where company_id = demo_company_id;
  delete from public.payroll_simulations where company_id = demo_company_id;
  delete from public.employees where company_id = demo_company_id;
  delete from public.payroll_concept_rules where company_id = demo_company_id;
  delete from public.legal_parameter_versions where company_id = demo_company_id;
  delete from public.legal_parameters where company_id = demo_company_id;
  delete from public.payroll_concepts where company_id = demo_company_id;
  delete from public.positions where company_id = demo_company_id;
  delete from public.departments where company_id = demo_company_id;
  delete from public.payroll_settings where company_id = demo_company_id;

  insert into public.payroll_settings
  select *
  from jsonb_populate_recordset(
    null::public.payroll_settings,
    coalesce(
      (select payload from public.demo_template_snapshots where source_company_id = demo_company_id and module = 'payroll_settings' order by created_at desc limit 1),
      '[]'::jsonb
    )
  );

  insert into public.positions
  select *
  from jsonb_populate_recordset(
    null::public.positions,
    coalesce(
      (select payload from public.demo_template_snapshots where source_company_id = demo_company_id and module = 'positions' order by created_at desc limit 1),
      '[]'::jsonb
    )
  );

  insert into public.departments
  select *
  from jsonb_populate_recordset(
    null::public.departments,
    coalesce(
      (select payload from public.demo_template_snapshots where source_company_id = demo_company_id and module = 'departments' order by created_at desc limit 1),
      '[]'::jsonb
    )
  );

  insert into public.payroll_concepts
  select *
  from jsonb_populate_recordset(
    null::public.payroll_concepts,
    coalesce(
      (select payload from public.demo_template_snapshots where source_company_id = demo_company_id and module = 'payroll_concepts' order by created_at desc limit 1),
      '[]'::jsonb
    )
  );

  insert into public.payroll_concept_rules
  select *
  from jsonb_populate_recordset(
    null::public.payroll_concept_rules,
    coalesce(
      (select payload from public.demo_template_snapshots where source_company_id = demo_company_id and module = 'payroll_concept_rules' order by created_at desc limit 1),
      '[]'::jsonb
    )
  );

  insert into public.legal_parameters
  select *
  from jsonb_populate_recordset(
    null::public.legal_parameters,
    coalesce(
      (select payload from public.demo_template_snapshots where source_company_id = demo_company_id and module = 'legal_parameters' order by created_at desc limit 1),
      '[]'::jsonb
    )
  );

  insert into public.legal_parameter_versions
  select *
  from jsonb_populate_recordset(
    null::public.legal_parameter_versions,
    coalesce(
      (select payload from public.demo_template_snapshots where source_company_id = demo_company_id and module = 'legal_parameter_versions' order by created_at desc limit 1),
      '[]'::jsonb
    )
  );

  insert into public.employees
  select *
  from jsonb_populate_recordset(
    null::public.employees,
    coalesce(
      (select payload from public.demo_template_snapshots where source_company_id = demo_company_id and module = 'employees' order by created_at desc limit 1),
      '[]'::jsonb
    )
  );

  insert into public.employee_contracts
  select *
  from jsonb_populate_recordset(
    null::public.employee_contracts,
    coalesce(
      (select payload from public.demo_template_snapshots where source_company_id = demo_company_id and module = 'employee_contracts' order by created_at desc limit 1),
      '[]'::jsonb
    )
  );

  insert into public.employee_rule_overrides
  select *
  from jsonb_populate_recordset(
    null::public.employee_rule_overrides,
    coalesce(
      (select payload from public.demo_template_snapshots where source_company_id = demo_company_id and module = 'employee_rule_overrides' order by created_at desc limit 1),
      '[]'::jsonb
    )
  );

  insert into public.overtime_records
  select *
  from jsonb_populate_recordset(
    null::public.overtime_records,
    coalesce(
      (select payload from public.demo_template_snapshots where source_company_id = demo_company_id and module = 'overtime_records' order by created_at desc limit 1),
      '[]'::jsonb
    )
  );

  insert into public.payroll_novelties
  select *
  from jsonb_populate_recordset(
    null::public.payroll_novelties,
    coalesce(
      (select payload from public.demo_template_snapshots where source_company_id = demo_company_id and module = 'payroll_novelties' order by created_at desc limit 1),
      '[]'::jsonb
    )
  );

  insert into public.incapacity_records
  select *
  from jsonb_populate_recordset(
    null::public.incapacity_records,
    coalesce(
      (select payload from public.demo_template_snapshots where source_company_id = demo_company_id and module = 'incapacity_records' order by created_at desc limit 1),
      '[]'::jsonb
    )
  );

  insert into public.vacation_records
  select *
  from jsonb_populate_recordset(
    null::public.vacation_records,
    coalesce(
      (select payload from public.demo_template_snapshots where source_company_id = demo_company_id and module = 'vacation_records' order by created_at desc limit 1),
      '[]'::jsonb
    )
  );

  insert into public.attendance_adjustments
  select *
  from jsonb_populate_recordset(
    null::public.attendance_adjustments,
    coalesce(
      (select payload from public.demo_template_snapshots where source_company_id = demo_company_id and module = 'attendance_adjustments' order by created_at desc limit 1),
      '[]'::jsonb
    )
  );

  insert into public.additional_deductions
  select *
  from jsonb_populate_recordset(
    null::public.additional_deductions,
    coalesce(
      (select payload from public.demo_template_snapshots where source_company_id = demo_company_id and module = 'additional_deductions' order by created_at desc limit 1),
      '[]'::jsonb
    )
  );

  update public.companies
  set payroll_initialized = true,
      updated_by = actor_id
  where id = demo_company_id;

  perform public.insert_payroll_audit_log(
    demo_company_id,
    actor_id,
    'setup',
    'reset_demo',
    demo_company_id,
    jsonb_build_object('reset', true),
    null,
    'Restablecimiento de la plantilla demo'
  );

  return jsonb_build_object('ok', true, 'demo_company_id', demo_company_id);
end;
$$;

do $$
declare
  manage_table text;
  operate_table text;
begin
  foreach manage_table in array array[
    'payroll_settings',
    'payroll_concepts',
    'payroll_concept_rules',
    'legal_parameters',
    'legal_parameter_versions',
    'positions',
    'departments'
  ]
  loop
    execute format('alter table public.%I enable row level security', manage_table);
    execute format('drop policy if exists %I on public.%I', manage_table || '_select', manage_table);
    execute format('drop policy if exists %I on public.%I', manage_table || '_write', manage_table);
    execute format(
      'create policy %I on public.%I for select using (public.can_view_company(company_id))',
      manage_table || '_select',
      manage_table
    );
    execute format(
      'create policy %I on public.%I for all using (public.can_manage_company(company_id)) with check (public.can_manage_company(company_id))',
      manage_table || '_write',
      manage_table
    );
  end loop;

  foreach operate_table in array array[
    'employees',
    'employee_contracts',
    'employee_rule_overrides',
    'payroll_novelties',
    'overtime_records',
    'incapacity_records',
    'vacation_records',
    'attendance_adjustments',
    'additional_deductions',
    'payroll_simulations',
    'payroll_audit_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', operate_table);
    execute format('drop policy if exists %I on public.%I', operate_table || '_select', operate_table);
    execute format('drop policy if exists %I on public.%I', operate_table || '_write', operate_table);
    execute format(
      'create policy %I on public.%I for select using (public.can_view_company(company_id))',
      operate_table || '_select',
      operate_table
    );
    execute format(
      'create policy %I on public.%I for all using (public.can_operate_payroll(company_id)) with check (public.can_operate_payroll(company_id))',
      operate_table || '_write',
      operate_table
    );
  end loop;
end $$;

alter table public.profiles enable row level security;
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_select
  on public.profiles
  for select
  using (id = auth.uid() or public.is_super_admin());
create policy profiles_update
  on public.profiles
  for update
  using (id = auth.uid() or public.is_super_admin())
  with check (id = auth.uid() or public.is_super_admin());

alter table public.companies enable row level security;
drop policy if exists companies_select on public.companies;
drop policy if exists companies_write on public.companies;
create policy companies_select
  on public.companies
  for select
  using (public.can_view_company(id));
create policy companies_write
  on public.companies
  for all
  using (public.can_manage_company(id))
  with check (public.can_manage_company(id));

alter table public.company_users enable row level security;
drop policy if exists company_users_select on public.company_users;
drop policy if exists company_users_write on public.company_users;
create policy company_users_select
  on public.company_users
  for select
  using (public.can_view_company(company_id));
create policy company_users_write
  on public.company_users
  for all
  using (public.can_manage_company(company_id))
  with check (public.can_manage_company(company_id));

alter table public.demo_template_snapshots enable row level security;
drop policy if exists demo_template_snapshots_select on public.demo_template_snapshots;
drop policy if exists demo_template_snapshots_write on public.demo_template_snapshots;
create policy demo_template_snapshots_select
  on public.demo_template_snapshots
  for select
  using (public.can_manage_company(source_company_id));
create policy demo_template_snapshots_write
  on public.demo_template_snapshots
  for all
  using (public.can_manage_company(source_company_id))
  with check (public.can_manage_company(source_company_id));

drop policy if exists payroll_supports_select on storage.objects;
drop policy if exists payroll_supports_insert on storage.objects;
drop policy if exists payroll_supports_update on storage.objects;
drop policy if exists payroll_supports_delete on storage.objects;

create policy payroll_supports_select
  on storage.objects
  for select
  using (
    bucket_id = 'payroll-supports'
    and public.can_view_company((storage.foldername(name))[1]::uuid)
  );

create policy payroll_supports_insert
  on storage.objects
  for insert
  with check (
    bucket_id = 'payroll-supports'
    and public.can_operate_payroll((storage.foldername(name))[1]::uuid)
  );

create policy payroll_supports_update
  on storage.objects
  for update
  using (
    bucket_id = 'payroll-supports'
    and public.can_operate_payroll((storage.foldername(name))[1]::uuid)
  )
  with check (
    bucket_id = 'payroll-supports'
    and public.can_operate_payroll((storage.foldername(name))[1]::uuid)
  );

create policy payroll_supports_delete
  on storage.objects
  for delete
  using (
    bucket_id = 'payroll-supports'
    and public.can_manage_company((storage.foldername(name))[1]::uuid)
  );
