# SandeQ

Modulo contable enfocado en horas extras y recargos para Colombia, construido en React + Vite y preparado para trabajar con la API de Aleluya.

## Incluye

- Login local para acceso al software
- Importacion de bases `.xlsx`
- Mapeo flexible de columnas
- Calculo de horas extras y recargos con reglas colombianas
- Conector operativo para Aleluya (`sessions`, `companies`, `periods`, `payrolls`, `payroll_concepts`, `overtime_items`)
- Branding de SandeQ con firma de Zivra Studio

## Credenciales de acceso

- Usuario: `admin@sandeli.com`
- Contrasena: `sandeli12@`

## Desarrollo local

```bash
npm install
npm run dev
```

## Validacion

```bash
npm run build
npm run lint
```

## Despliegue en Vercel

Este repositorio ya queda listo para desplegarse sin `vercel.json`.

- Framework: Vite
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`
- Node recomendado: `20+`

Archivos clave para el despliegue:

- `package.json`
- `package-lock.json`
- `.nvmrc`

Si conectas el repositorio desde Vercel, deberia detectar la configuracion automaticamente.

## Estructura principal

- `src/App.jsx`: interfaz principal y flujo de login
- `src/lib/overtime.js`: reglas, calculos, importacion y payloads para Aleluya
- `src/App.css`: estilos del dashboard y pantalla de acceso
- `public/branding/logoIOS.png`: favicon y branding visual
