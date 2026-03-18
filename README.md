# SandeQ

Software contable enfocado en horas extras y recargos para Colombia, construido en React + Vite como herramienta interna de control, liquidacion y revision.

## Incluye

- Login local para acceso al software
- Importacion de bases `.xlsx`
- Mapeo flexible de columnas
- Calculo de horas extras y recargos con reglas colombianas
- Consolidado por persona y por concepto
- Alertas operativas y resumen interno en JSON
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
- `src/lib/overtime.js`: reglas, calculos, importacion y resumenes internos de horas extras
- `src/App.css`: estilos del dashboard y pantalla de acceso
- `public/branding/logoIOS.png`: favicon y branding visual
