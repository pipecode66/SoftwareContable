# KAIKO Payroll

Sistema integral de nómina configurable para Colombia sobre `Next.js + React + TypeScript + Supabase`, construido como evolución del módulo actual de horas extras sin eliminar la lógica existente.

## Estado actual

- Mantiene el motor heredado de horas extras y recargos en [src/lib/overtime.js](/c:/Users/juanitou/Documents/TRABAJO/SoftwareContable/repo-remote/src/lib/overtime.js).
- Conserva la SPA anterior en [src/App.jsx](/c:/Users/juanitou/Documents/TRABAJO/SoftwareContable/repo-remote/src/App.jsx) como referencia funcional durante la migración.
- Agrega una nueva capa persistente multiempresa en `app/` con Auth, RLS, onboarding, catálogo de nómina, empleados, novedades, incapacidades, vacaciones, descuentos, simulador y auditoría.

## Stack

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Supabase Auth`
- `PostgreSQL / Supabase`
- `Row Level Security`
- `Server Components + Server Actions`
- `Vitest` para pruebas existentes

## Variables de entorno

Crear `.env.local` con:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Estructura principal

- [app](/c:/Users/juanitou/Documents/TRABAJO/SoftwareContable/repo-remote/app)
  Rutas Next del dashboard y onboarding.
- [src/lib/supabase](/c:/Users/juanitou/Documents/TRABAJO/SoftwareContable/repo-remote/src/lib/supabase)
  Clientes browser/server/admin y utilidades de sesión.
- [src/server/auth/context.ts](/c:/Users/juanitou/Documents/TRABAJO/SoftwareContable/repo-remote/src/server/auth/context.ts)
  Contexto autenticado, membresías y empresa activa.
- [src/server/payroll/repository.ts](/c:/Users/juanitou/Documents/TRABAJO/SoftwareContable/repo-remote/src/server/payroll/repository.ts)
  Lectura de datos multiempresa.
- [src/server/payroll/calculator.ts](/c:/Users/juanitou/Documents/TRABAJO/SoftwareContable/repo-remote/src/server/payroll/calculator.ts)
  Motor de cálculo servidor para liquidación.
- [src/server/payroll/actions/payroll.ts](/c:/Users/juanitou/Documents/TRABAJO/SoftwareContable/repo-remote/src/server/payroll/actions/payroll.ts)
  Mutaciones críticas del sistema.
- [supabase/migrations/20260320153000_payroll_schema.sql](/c:/Users/juanitou/Documents/TRABAJO/SoftwareContable/repo-remote/supabase/migrations/20260320153000_payroll_schema.sql)
  Esquema relacional base.
- [supabase/migrations/20260320154000_payroll_security_and_functions.sql](/c:/Users/juanitou/Documents/TRABAJO/SoftwareContable/repo-remote/supabase/migrations/20260320154000_payroll_security_and_functions.sql)
  Funciones, clonación demo, reset demo y RLS.
- [supabase/seed.sql](/c:/Users/juanitou/Documents/TRABAJO/SoftwareContable/repo-remote/supabase/seed.sql)
  Seed demo/admin, catálogos, empleados y snapshots.

## Tablas principales

- `profiles`
- `companies`
- `company_users`
- `payroll_settings`
- `payroll_concepts`
- `payroll_concept_rules`
- `legal_parameters`
- `legal_parameter_versions`
- `positions`
- `departments`
- `employees`
- `employee_contracts`
- `employee_rule_overrides`
- `payroll_novelties`
- `overtime_records`
- `incapacity_records`
- `vacation_records`
- `attendance_adjustments`
- `additional_deductions`
- `payroll_simulations`
- `payroll_audit_logs`
- `demo_template_snapshots`

## Cuenta demo vs. otras cuentas

### Demo

- Usuario: `demo@sandeli.com`
- Contraseña: `sandeli12@`
- Empresa seed: `Sandeli Demo`
- Entra con configuración completa, conceptos base, parámetros legales, empleados y snapshots.
- Puede restablecerse con la función SQL `reset_demo_payroll_template()`.

### Admin / otras cuentas

- Usuario seed adicional: `admin@sandeli.com`
- Contraseña: `sandeli12@`
- La empresa `Sandeli Administración` queda creada pero sin nómina inicializada.
- Al entrar va a `/setup/payroll`.
- Puede:
  - clonar la configuración demo con `clone_demo_payroll_config(target_company_id)`
  - personalizar desde el wizard inicial

## Rutas creadas

- `/login`
- `/setup/payroll`
- `/payroll`
- `/payroll/settings`
- `/payroll/concepts`
- `/payroll/legal-parameters`
- `/payroll/overtime`
- `/payroll/novelties`
- `/payroll/incapacities`
- `/payroll/vacations`
- `/payroll/deductions`
- `/payroll/employees`
- `/payroll/positions`
- `/payroll/departments`
- `/payroll/simulator`
- `/payroll/audit`

## Flujo técnico

1. El usuario inicia sesión con Supabase Auth.
2. [proxy.ts](/c:/Users/juanitou/Documents/TRABAJO/SoftwareContable/repo-remote/proxy.ts) refresca la sesión.
3. [src/server/auth/context.ts](/c:/Users/juanitou/Documents/TRABAJO/SoftwareContable/repo-remote/src/server/auth/context.ts) resuelve perfil, membresías y empresa activa.
4. Si la empresa no está inicializada, se redirige a `/setup/payroll`.
5. Si el usuario clona demo, se ejecuta `clone_demo_payroll_config`.
6. Si personaliza, se crean `payroll_settings`, conceptos, parámetros, cargos y áreas base por empresa.
7. Los módulos leen desde repositorios server-side y las escrituras pasan por server actions.
8. El simulador usa horas extras, novedades, incapacidades, vacaciones y descuentos para generar snapshots persistidos.

## Seguridad

- RLS activado por empresa.
- Roles mínimos:
  - `super_admin`
  - `company_admin`
  - `payroll_analyst`
  - `viewer`
- Las funciones críticas viven en SQL y server actions.
- `Storage` preparado con bucket `payroll-supports` para soportes documentales por empresa.

## Desarrollo local

```bash
npm install
npm run dev
```

## Validación usada

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Nota: `npm run lint` deja 2 advertencias heredadas por el uso de `<img>` en la SPA antigua [src/App.jsx](/c:/Users/juanitou/Documents/TRABAJO/SoftwareContable/repo-remote/src/App.jsx), pero no bloquea el build ni la nueva capa en Next.

## Supabase

Aplicación de esquema y seed:

```bash
supabase db reset
```

o aplicando manualmente:

1. [supabase/migrations/20260320153000_payroll_schema.sql](/c:/Users/juanitou/Documents/TRABAJO/SoftwareContable/repo-remote/supabase/migrations/20260320153000_payroll_schema.sql)
2. [supabase/migrations/20260320154000_payroll_security_and_functions.sql](/c:/Users/juanitou/Documents/TRABAJO/SoftwareContable/repo-remote/supabase/migrations/20260320154000_payroll_security_and_functions.sql)
3. [supabase/seed.sql](/c:/Users/juanitou/Documents/TRABAJO/SoftwareContable/repo-remote/supabase/seed.sql)

## Despliegue en Vercel

No requiere `vercel.json`.

- Framework: `Next.js`
- Install Command: `npm install`
- Build Command: `npm run build`
- Environment Variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Notas de mantenimiento

- La tipificación de Supabase quedó temporalmente permisiva en [src/lib/supabase/types.ts](/c:/Users/juanitou/Documents/TRABAJO/SoftwareContable/repo-remote/src/lib/supabase/types.ts) para acelerar la migración. El siguiente paso ideal es regenerar tipos desde el proyecto real de Supabase.
- La SPA antigua sigue disponible mientras termina la migración de todos los flujos visuales a `app/`.
- El motor nuevo ya está preparado para extenderse con:
  - integración real de soportes en Storage
  - cargas masivas
  - biometría/asistencia
  - tirillas y exportaciones avanzadas
