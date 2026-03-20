-- Demo and admin auth users
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'demo@sandeli.com',
    crypt('sandeli12@', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Cuenta Demo Sandeli"}',
    timezone('utc', now()),
    timezone('utc', now()),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'admin@sandeli.com',
    crypt('sandeli12@', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Administrador Sandeli"}',
    timezone('utc', now()),
    timezone('utc', now()),
    '',
    '',
    '',
    ''
  )
on conflict (id) do update
set email = excluded.email,
    raw_user_meta_data = excluded.raw_user_meta_data,
    encrypted_password = excluded.encrypted_password;

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  created_at,
  updated_at
)
values
  (
    '31111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    '{"sub":"11111111-1111-4111-8111-111111111111","email":"demo@sandeli.com"}',
    'email',
    'demo@sandeli.com',
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    '32222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    '{"sub":"22222222-2222-4222-8222-222222222222","email":"admin@sandeli.com"}',
    'email',
    'admin@sandeli.com',
    timezone('utc', now()),
    timezone('utc', now())
  )
on conflict (id) do nothing;

insert into public.companies (
  id,
  name,
  slug,
  country_code,
  timezone,
  is_demo_template,
  payroll_initialized,
  created_by,
  updated_by
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Sandeli Demo',
    'sandeli-demo',
    'CO',
    'America/Bogota',
    true,
    true,
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Sandeli Administración',
    'sandeli-admin',
    'CO',
    'America/Bogota',
    false,
    false,
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222'
  )
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug,
    is_demo_template = excluded.is_demo_template,
    payroll_initialized = excluded.payroll_initialized;

insert into public.profiles (
  id,
  email,
  full_name,
  is_demo,
  default_company_id
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'demo@sandeli.com',
    'Cuenta Demo Sandeli',
    true,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'admin@sandeli.com',
    'Administrador Sandeli',
    false,
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  )
on conflict (id) do update
set email = excluded.email,
    full_name = excluded.full_name,
    is_demo = excluded.is_demo,
    default_company_id = excluded.default_company_id;

insert into public.company_users (
  id,
  company_id,
  user_id,
  role,
  is_active,
  created_by,
  updated_by
)
values
  (
    '41111111-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'company_admin',
    true,
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    '42222222-2222-4222-8222-222222222222',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '22222222-2222-4222-8222-222222222222',
    'company_admin',
    true,
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222'
  )
on conflict (id) do nothing;

delete from public.payroll_settings where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
insert into public.payroll_settings (
  id,
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
values (
  '50000000-0000-4000-8000-000000000001',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'CO',
  'quincenal',
  true,
  true,
  true,
  true,
  true,
  '06:00',
  '21:00',
  '21:00',
  46,
  '{"mode":"demo","country":"CO"}',
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111'
);

delete from public.departments where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
insert into public.departments (id, company_id, code, name, description, config, created_by, updated_by)
values
  ('60000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','ADM','Administración','Administración y soporte','{}','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('60000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','COC','Cocina','Producción y cocina','{}','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('60000000-0000-4000-8000-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','SAL','Servicio','Atención al cliente y caja','{}','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('60000000-0000-4000-8000-000000000004','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','DIG','Canales digitales','Ventas online','{}','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111');

delete from public.positions where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
insert into public.positions (id, company_id, code, name, description, config, created_by, updated_by)
values
  ('70000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','ADMIN','Administrador','Manejo y confianza','{"allows_overtime":false,"allows_night_surcharge":true,"allows_sunday":true}','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('70000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','COC_JEFE','Jefe de cocina','Responsable de producción','{"allows_overtime":true}','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('70000000-0000-4000-8000-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','COC_AUX','Aux. cocina','Apoyo de cocina','{"allows_overtime":true}','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('70000000-0000-4000-8000-000000000004','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','SERVICIO','Anfitriona','Atención al cliente','{"allows_overtime":true}','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('70000000-0000-4000-8000-000000000005','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','CAJA','Caja','Caja y recaudo','{"allows_overtime":true}','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111');

delete from public.payroll_concepts where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
insert into public.payroll_concepts (
  id, company_id, code, name, category, subcategory, type, is_active, is_base_concept, is_editable, is_deletable,
  salary_constitutive, affects_health_ibc, affects_pension_ibc, affects_arl_ibc, affects_parafiscals,
  affects_severance, affects_severance_interest, affects_service_bonus, affects_vacation_base,
  requires_days, requires_hours, requires_amount, auto_calculated, formula_type, formula_config,
  priority, rounding_mode, applies_by_default, created_by, updated_by
)
values
  ('80000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','SALARIO_BASICO','Salario básico','ingresos_salariales','basico','earning',true,true,false,false,true,true,true,true,true,true,true,true,true,false,false,true,true,'salary_base','{}',10,'half_up',true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('80000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','HED','Horas extras diurnas','ingresos_salariales','horas_extras','earning',true,true,true,false,true,true,true,true,true,true,true,true,true,false,true,true,true,'overtime_day','{}',20,'half_up',true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('80000000-0000-4000-8000-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','HEN','Horas extras nocturnas','ingresos_salariales','horas_extras','earning',true,true,true,false,true,true,true,true,true,true,true,true,true,false,true,true,true,'overtime_night','{}',21,'half_up',true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('80000000-0000-4000-8000-000000000004','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','RN','Recargo nocturno','ingresos_salariales','recargos','earning',true,true,true,false,true,true,true,true,true,true,true,true,true,false,true,true,true,'night_surcharge','{}',22,'half_up',true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('80000000-0000-4000-8000-000000000005','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','DOMFEST','Dominical o festivo','ingresos_salariales','recargos','earning',true,true,true,false,true,true,true,true,true,true,true,true,true,false,true,true,true,'sunday_surcharge','{}',23,'half_up',true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('80000000-0000-4000-8000-000000000006','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','AUX_TRANSPORTE','Auxilio de transporte','ingresos_no_salariales','auxilios','earning',true,true,true,false,false,false,false,false,false,false,false,false,false,false,false,true,true,'transport_allowance','{}',30,'half_up',true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('80000000-0000-4000-8000-000000000007','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','BONO_SALARIAL','Bonificaciones salariales','ingresos_salariales','bonificaciones','earning',true,false,true,true,true,true,true,true,true,true,true,true,true,false,false,true,false,'manual','{}',35,'half_up',true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('80000000-0000-4000-8000-000000000008','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','COMISION','Comisiones','ingresos_salariales','comisiones','earning',true,false,true,true,true,true,true,true,true,true,true,true,true,false,false,true,false,'manual','{}',36,'half_up',true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('80000000-0000-4000-8000-000000000009','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','SALUD_EMPLEADO','Salud empleado','descuentos_empleado','seguridad_social','deduction',true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,true,true,'health_employee','{}',100,'half_up',true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('80000000-0000-4000-8000-000000000010','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','PENSION_EMPLEADO','Pensión empleado','descuentos_empleado','seguridad_social','deduction',true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,true,true,'pension_employee','{}',101,'half_up',true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('80000000-0000-4000-8000-000000000011','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','SALUD_EMPRESA','Salud empleador','aportes_empresa','seguridad_social','employer_contribution',true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,true,true,'health_employer','{}',110,'half_up',true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('80000000-0000-4000-8000-000000000012','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','PENSION_EMPRESA','Pensión empleador','aportes_empresa','seguridad_social','employer_contribution',true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,true,true,'pension_employer','{}',111,'half_up',true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('80000000-0000-4000-8000-000000000013','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','ARL','ARL','aportes_empresa','seguridad_social','employer_contribution',true,true,true,false,false,false,false,false,false,false,false,false,false,false,false,true,true,'arl','{}',112,'half_up',true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('80000000-0000-4000-8000-000000000014','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','CESANTIAS','Cesantías','prestaciones','prestaciones_sociales','provision',true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,true,true,'severance','{}',130,'half_up',true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('80000000-0000-4000-8000-000000000015','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','PRIMA','Prima de servicios','prestaciones','prestaciones_sociales','provision',true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,true,true,'service_bonus','{}',132,'half_up',true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('80000000-0000-4000-8000-000000000016','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','VAC_CAUSADAS','Vacaciones causadas','prestaciones','vacaciones','provision',true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,true,true,'vacation_accrual','{}',133,'half_up',true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('80000000-0000-4000-8000-000000000017','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','INCAP_EG','Incapacidad enfermedad general','novedades','incapacidades','novelty',true,true,true,false,true,true,true,true,true,true,true,true,true,true,false,true,false,'manual','{"recommended_percentage":0.6667}',200,'half_up',true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('80000000-0000-4000-8000-000000000018','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','FALTA_J','Falta justificada','novedades','faltas','novelty',true,true,true,false,false,false,false,false,false,false,false,false,false,true,false,true,false,'manual','{}',201,'half_up',true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('80000000-0000-4000-8000-000000000019','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','FALTA_NJ','Falta no justificada','novedades','faltas','deduction',true,true,true,false,false,false,false,false,false,false,false,false,false,true,false,true,false,'manual','{}',202,'half_up',true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111');

delete from public.legal_parameter_versions where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
delete from public.legal_parameters where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
insert into public.legal_parameters (id, company_id, key, name, description, value_type, is_global, can_company_override, created_by, updated_by)
values
  ('90000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','salario_minimo','Salario mínimo','SMMLV 2026','number',false,true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('90000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','auxilio_transporte','Auxilio de transporte','Auxilio 2026','number',false,true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('90000000-0000-4000-8000-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','salud_empleado','Salud empleado','Porcentaje empleado','percentage',false,true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('90000000-0000-4000-8000-000000000004','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','salud_empleador','Salud empleador','Porcentaje empresa','percentage',false,true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('90000000-0000-4000-8000-000000000005','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','pension_empleado','Pensión empleado','Porcentaje empleado','percentage',false,true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('90000000-0000-4000-8000-000000000006','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','pension_empleador','Pensión empleador','Porcentaje empresa','percentage',false,true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('90000000-0000-4000-8000-000000000007','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','recargo_nocturno','Recargo nocturno','35%','percentage',false,true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('90000000-0000-4000-8000-000000000008','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','hora_extra_diurna','Hora extra diurna','1.25','percentage',false,true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('90000000-0000-4000-8000-000000000009','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','hora_extra_nocturna','Hora extra nocturna','1.75','percentage',false,true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('90000000-0000-4000-8000-000000000010','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','dominical_festivo','Dominical o festivo','Recargo vigente','percentage',false,true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('90000000-0000-4000-8000-000000000011','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','arl_risk_classes','ARL por clases','Mapa de riesgo','json',false,true,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111');

insert into public.legal_parameter_versions (id, company_id, legal_parameter_id, value, version_label, valid_from, created_by, updated_by)
values
  ('91000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','90000000-0000-4000-8000-000000000001','{"amount":1423500}','2026','2026-01-01','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('91000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','90000000-0000-4000-8000-000000000002','{"amount":200000}','2026','2026-01-01','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('91000000-0000-4000-8000-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','90000000-0000-4000-8000-000000000003','{"rate":0.04}','2026','2026-01-01','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('91000000-0000-4000-8000-000000000004','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','90000000-0000-4000-8000-000000000004','{"rate":0.085}','2026','2026-01-01','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('91000000-0000-4000-8000-000000000005','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','90000000-0000-4000-8000-000000000005','{"rate":0.04}','2026','2026-01-01','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('91000000-0000-4000-8000-000000000006','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','90000000-0000-4000-8000-000000000006','{"rate":0.12}','2026','2026-01-01','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('91000000-0000-4000-8000-000000000007','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','90000000-0000-4000-8000-000000000007','{"rate":0.35}','2026','2026-01-01','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('91000000-0000-4000-8000-000000000008','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','90000000-0000-4000-8000-000000000008','{"rate":1.25}','2026','2026-01-01','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('91000000-0000-4000-8000-000000000009','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','90000000-0000-4000-8000-000000000009','{"rate":1.75}','2026','2026-01-01','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('91000000-0000-4000-8000-000000000010','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','90000000-0000-4000-8000-000000000010','{"rate":0.8}','2026','2026-01-01','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('91000000-0000-4000-8000-000000000011','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','90000000-0000-4000-8000-000000000011','{"class_1":0.00522,"class_2":0.01044,"class_3":0.02436,"class_4":0.0435,"class_5":0.0696}','2026','2026-01-01','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111');

delete from public.employees where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
insert into public.employees (
  id, company_id, first_name, last_name, full_name, phone, document_type, document_number, position_id, department_id,
  admission_date, status, base_salary, hourly_value, weekly_hours, rest_day, notes, created_by, updated_by
)
values
  ('a1000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','HEINER','BARÓN','HEINER BARÓN','3212162127','CC','100000001','70000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','2024-11-05','active',2200000,11082,46,'lunes','Manejo y confianza','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('a1000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','DAVID','','DAVID','3000000000','CC','100000002','70000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','2025-01-20','active',2000000,10069,46,'domingo','Sin contrato formal','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('a1000000-0000-4000-8000-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','ARLEY','GIL','ARLEY GIL','3155946351','CC','100000003','70000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000002','2025-02-01','active',2500000,12586,46,'domingo',null,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('a1000000-0000-4000-8000-000000000004','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','DAVID','GUERRERO','DAVID GUERRERO','3128474224','CC','100000004','70000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000002','2025-02-03','active',1700000,8558,46,'jueves',null,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('a1000000-0000-4000-8000-000000000005','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','MIGUEL','BRICEÑO','MIGUEL BRICEÑO','3174864441','CC','100000005','70000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000002','2025-02-14','active',1900000,9566,46,'lunes',null,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('a1000000-0000-4000-8000-000000000006','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','HANMARIS','BERMUDEZ','HANMARIS BERMUDEZ','3115918118','CC','100000006','70000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000002','2025-02-18','active',1800000,9062,46,'jueves',null,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('a1000000-0000-4000-8000-000000000007','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','JOHANNA','LEON','JOHANNA LEON','3224070410','CC','100000007','70000000-0000-4000-8000-000000000004','60000000-0000-4000-8000-000000000003','2025-02-26','active',1600000,8054,46,'lunes',null,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('a1000000-0000-4000-8000-000000000008','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','MARLIN','LUNA','MARLIN LUNA','3204022889','CC','100000008','70000000-0000-4000-8000-000000000004','60000000-0000-4000-8000-000000000003','2025-03-04','active',1600000,8054,46,'martes',null,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('a1000000-0000-4000-8000-000000000009','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','BREINER','ALVARADO','BREINER ALVARADO','3024002580','CC','100000009','70000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','2025-03-10','active',1850000,9314,46,'domingo',null,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('a1000000-0000-4000-8000-000000000010','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','JIMENA','ROBLES','JIMENA ROBLES','3212628648','CC','100000010','70000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000004','2025-03-17','active',1650000,8306,46,'domingo',null,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('a1000000-0000-4000-8000-000000000011','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','LISAY','ANGEL','LISAY ANGEL','3008669462','CC','100000011','70000000-0000-4000-8000-000000000005','60000000-0000-4000-8000-000000000003','2025-03-24','active',1700000,8558,46,'sábado',null,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('a1000000-0000-4000-8000-000000000012','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','DARA','','DARA','3143451207','CC','100000012','70000000-0000-4000-8000-000000000004','60000000-0000-4000-8000-000000000003','2025-04-08','active',950000,7312,30,'domingo','Turnera 30 horas','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('a1000000-0000-4000-8000-000000000013','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','N/A','','N/A','0000000000','CC','100000013','70000000-0000-4000-8000-000000000005','60000000-0000-4000-8000-000000000003','2025-04-15','inactive',0,0,8,'domingo','Vacante turno sábado','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111');

delete from public.employee_contracts where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
insert into public.employee_contracts (
  id, company_id, employee_id, contract_type, payment_frequency, salary_base, transport_allowance, bonus_amount,
  commission_enabled, social_security_enabled, parafiscals_enabled, benefits_enabled, arl_risk_class,
  start_date, created_by, updated_by
)
values
  ('b1000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000001','manejo_confianza','mensual',2200000,200000,0,false,true,true,true,1,'2024-11-05','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('b1000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000002','sin_contrato','quincenal',1000000,0,300000,false,false,false,false,1,'2025-01-20','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111');

insert into public.employee_contracts (
  id, company_id, employee_id, contract_type, payment_frequency, salary_base, transport_allowance, bonus_amount,
  commission_enabled, social_security_enabled, parafiscals_enabled, benefits_enabled, arl_risk_class,
  start_date, created_by, updated_by
)
select
  gen_random_uuid(),
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  id,
  'termino_indefinido',
  'quincenal',
  base_salary,
  case when base_salary <= 2847000 then 200000 else 0 end,
  0,
  false,
  true,
  true,
  true,
  1,
  admission_date,
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111'
from public.employees
where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  and id not in ('a1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000002');

delete from public.employee_rule_overrides where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
insert into public.employee_rule_overrides (
  id, company_id, employee_id, rule_key, rule_value, priority, valid_from, created_by, updated_by
)
values
  ('c1000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000001','aplica_horas_extras','{"enabled":false}',500,'2024-11-05','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('c1000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000001','aplica_recargo_nocturno','{"enabled":true}',500,'2024-11-05','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('c1000000-0000-4000-8000-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000002','aplica_horas_extras','{"enabled":false}',500,'2025-01-20','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('c1000000-0000-4000-8000-000000000004','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000002','aplica_recargo_nocturno','{"enabled":false}',500,'2025-01-20','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('c1000000-0000-4000-8000-000000000005','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000002','aplica_dominical','{"enabled":true}',500,'2025-01-20','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111');

delete from public.overtime_records where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
insert into public.overtime_records (
  id, company_id, employee_id, work_date, ordinary_hours, extra_day_hours, extra_night_hours, night_surcharge_hours,
  sunday_hours, festive_hours, sunday_night_hours, extra_sunday_day_hours, extra_sunday_night_hours,
  source, raw_payload, created_by, updated_by
)
values
  ('d1000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000003','2026-03-05',8,2,1,2,0,0,0,0,0,'demo','{}','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('d1000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000004','2026-03-07',8,1.5,0,1,0,0,0,0,0,'demo','{}','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('d1000000-0000-4000-8000-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000001','2026-03-08',8,0,0,3,4,0,0,0,0,'demo','{}','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('d1000000-0000-4000-8000-000000000004','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000012','2026-03-12',6,1,0,0,0,0,0,0,0,'demo','{}','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111');

delete from public.payroll_novelties where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
insert into public.payroll_novelties (
  id, company_id, employee_id, novelty_type, concept_id, date_start, date_end, days, hours, amount,
  impact_salary, impact_benefits, notes, metadata, created_by, updated_by
)
values
  ('e1000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000007','falta_no_justificada','80000000-0000-4000-8000-000000000019','2026-03-10','2026-03-10',1,null,-53333,true,true,'No presentó soporte','{}','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
  ('e1000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000006','falta_justificada','80000000-0000-4000-8000-000000000018','2026-03-11','2026-03-11',1,null,0,false,false,'Cita médica','{}','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111');

delete from public.incapacity_records where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
insert into public.incapacity_records (
  id, company_id, employee_id, incapacity_type, origin, start_date, end_date, days, payment_percentage,
  payer_responsible, notes, created_by, updated_by
)
values
  ('f1000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000004','enfermedad_general','EPS','2026-03-13','2026-03-15',3,66.67,'empresa','Reposo general','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111');

delete from public.vacation_records where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
insert into public.vacation_records (
  id, company_id, employee_id, record_type, start_date, end_date, days, enjoyed_days, pending_days, paid_amount, notes, created_by, updated_by
)
values
  ('g1000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000010','programadas','2026-04-01','2026-04-05',5,0,10,0,'Bloque aprobado','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111');

delete from public.attendance_adjustments where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
insert into public.attendance_adjustments (
  id, company_id, employee_id, adjustment_date, status, expected_start, actual_start, late_hours,
  impact_salary, notes, metadata, created_by, updated_by
)
values
  ('h1000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000011','2026-03-14','late','08:00','08:30',0.5,true,'Ingreso tardío autorizado','{}','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111');

delete from public.additional_deductions where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
insert into public.additional_deductions (
  id, company_id, employee_id, concept_name, amount, recurrence, applies_from, notes, created_by, updated_by
)
values
  ('i1000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000003','Préstamo caja menor',80000,'monthly','2026-03-01','Descuento interno','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111');

delete from public.demo_template_snapshots where source_company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
insert into public.demo_template_snapshots (source_company_id, module, version_label, payload, created_by)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','payroll_settings','v1',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from public.payroll_settings t where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','positions','v1',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from public.positions t where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','departments','v1',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from public.departments t where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','payroll_concepts','v1',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from public.payroll_concepts t where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','payroll_concept_rules','v1','[]'::jsonb,'11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','legal_parameters','v1',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from public.legal_parameters t where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','legal_parameter_versions','v1',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from public.legal_parameter_versions t where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','employees','v1',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from public.employees t where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','employee_contracts','v1',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from public.employee_contracts t where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','employee_rule_overrides','v1',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from public.employee_rule_overrides t where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','overtime_records','v1',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from public.overtime_records t where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','payroll_novelties','v1',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from public.payroll_novelties t where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','incapacity_records','v1',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from public.incapacity_records t where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','vacation_records','v1',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from public.vacation_records t where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','attendance_adjustments','v1',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from public.attendance_adjustments t where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','additional_deductions','v1',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from public.additional_deductions t where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'11111111-1111-4111-8111-111111111111');

select public.insert_payroll_audit_log(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '11111111-1111-4111-8111-111111111111',
  'setup',
  'seed_demo',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  jsonb_build_object('seeded', true),
  null,
  'Inicialización de la plantilla demo'
);
