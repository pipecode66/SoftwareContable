# KAIKO

Software contable para Colombia construido en React + Vite. Mantiene el flujo original de horas extras basado en Excel y ahora suma un módulo ampliado de gestión laboral con empleados, horarios, novedades, liquidaciones, exportaciones, tirillas y base desacoplada para WhatsApp.

## Incluye

- Login local para acceso interno
- Importación de bases `.xlsx` con mapeo flexible de columnas
- Flujo histórico de horas extras y recargos sin romper compatibilidad
- Módulo ampliado de empleados con CRUD, reglas y tipos parametrizados
- Horarios, turnos, días de descanso y novedades operativas
- Liquidación diaria, semanal, quincenal y mensual con prioridad quincenal
- Exportación corporativa a PDF y Excel
- Tirilla individual y base de integración para WhatsApp
- Auditoría local, historial de exportaciones y trazabilidad de cálculos

## Credenciales de acceso

- Usuario: `admin@sandeli.com`
- Contraseña: `sandeli12@`

## Arquitectura implementada

- `src/App.jsx`
  Mantiene el login y el módulo original de horas extras.
- `src/lib/overtime.js`
  Conserva el motor legado de importación, cálculo y resúmenes del flujo inicial.
- `src/modules/workforce/data.js`
  Semillas, catálogos, tipos de empleado, roles, jornadas y estructura de datos.
- `src/modules/workforce/store.js`
  Repositorio local, migración de datos, auditoría, CRUD y liquidación por período.
- `src/modules/workforce/payrollEngine.js`
  Reglas de negocio desacopladas para manejo y confianza, sin contrato y turneros.
- `src/modules/workforce/exportService.js`
  Salida a Excel, PDF y tirilla individual.
- `src/modules/workforce/whatsappService.js`
  Servicio abstracto listo para Cloud API, Twilio u otra pasarela.
- `src/modules/workforce/apiContract.js`
  Contrato de endpoints preparado para una futura capa backend.
- `src/modules/workforce/WorkforceModule.jsx`
  UI del módulo ampliado de personal, horarios, liquidaciones, exportaciones y notificaciones.

## Datos semilla

La base local arranca con:

- Heiner como administrador con manejo y confianza
- David como personal sin contrato
- El equipo operativo suministrado
- Turneros, vacante y jornadas base del negocio
- Períodos quincenales iniciales
- Horarios por defecto y novedades de ejemplo

## Flujo técnico resumido

1. El módulo legado importa Excel y calcula horas extras sin depender de APIs externas.
2. El módulo laboral usa una base persistida en `localStorage` con migración y semillas.
3. Cada empleado guarda reglas contractuales y de pago desacopladas de la UI.
4. Las novedades alimentan la liquidación por período en `payrollEngine`.
5. Cada cálculo deja trazas, historial de exportación y eventos de auditoría.
6. Los envíos por WhatsApp quedan registrados con estado `pendiente`, `enviado` o `error`.

## Desarrollo local

```bash
npm install
npm run dev
```

## Validación

```bash
npm run test
npm run lint
npm run build
```

## Despliegue en Vercel

Este repositorio queda listo para desplegarse sin `vercel.json`.

- Framework: Vite
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`
- Node recomendado: `20+`

Archivos clave:

- `package.json`
- `package-lock.json`
- `.nvmrc`
- `public/branding/logoIOS.png`
