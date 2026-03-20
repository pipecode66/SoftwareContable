# KAIKO

Dashboard ejecutivo de gestión laboral con login obligatorio, construido en React + Vite.

## Cuentas incluidas

- `admin@sandeli.com`
  Entorno vacío para operación real.
- `demo@sandeli.com`
  Entorno de demostración con empleados, horarios, novedades, nómina y Excel de ejemplo.

Ambas usan la contraseña configurada en el proyecto.

## Módulos principales

- Dashboard
  Vista ejecutiva con indicadores operativos y financieros.
- Empleados
  CRUD de fecha de admisión, nombre, cargo, salario base, carga horaria y valor por hora.
- Horario
  Vista semanal empresarial por empleado, con faltas justificadas, no justificadas y control de atrasos.
- Nómina
  Resumen general, filtros por año/mes/empleado/cargo, gráficos y visor de Excel.

## Lógica incluida

- Carga separada por cuenta usando `localStorage`
- Demo solo en la cuenta `demo`
- Horario general y turnos especiales para el entorno demo
- Atraso automático cuando no se registra ingreso en la hora prevista
- Falta no justificada automática cuando no se registra ingreso en días ya vencidos
- Gráficos internos de horas extras, gasto, cargos y resultados mensuales

## Archivos clave

- `src/App.jsx`
  Estructura principal del login y dashboard.
- `src/App.css`
  Estilo ejecutivo y navegación general.
- `src/lib/dashboardData.js`
  Cuentas, semillas demo, horarios, analítica y persistencia.
- `src/modules/workforce/payrollEngine.test.js`
  Pruebas unitarias del motor existente de liquidación.

## Desarrollo local

```bash
npm install
npm run dev
```

## Validación

```bash
npm run lint
npm run build
npm run test
```

## Despliegue en Vercel

No requiere `vercel.json`.

- Framework: `Vite`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`
