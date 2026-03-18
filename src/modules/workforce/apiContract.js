export const WORKFORCE_API_CONTRACT = {
  employees: [
    { method: "GET", path: "/api/employees", permission: "ver_empleados" },
    { method: "POST", path: "/api/employees", permission: "crear_empleados" },
    { method: "GET", path: "/api/employees/:id", permission: "ver_empleados" },
    { method: "PUT", path: "/api/employees/:id", permission: "editar_empleados" },
    { method: "DELETE", path: "/api/employees/:id", permission: "eliminar_empleados" },
  ],
  schedules: [
    { method: "GET", path: "/api/schedules", permission: "ver_horarios" },
    { method: "POST", path: "/api/schedule-assignments", permission: "asignar_horarios" },
    { method: "PUT", path: "/api/schedule-assignments/:id", permission: "asignar_horarios" },
    { method: "DELETE", path: "/api/schedule-assignments/:id", permission: "asignar_horarios" },
  ],
  attendance: [
    { method: "GET", path: "/api/attendance", permission: "ver_horarios" },
    { method: "POST", path: "/api/attendance", permission: "asignar_horarios" },
    { method: "PUT", path: "/api/attendance/:id", permission: "asignar_horarios" },
    { method: "DELETE", path: "/api/attendance/:id", permission: "asignar_horarios" },
  ],
  payroll: [
    { method: "GET", path: "/api/payroll-periods", permission: "ver_liquidaciones" },
    { method: "POST", path: "/api/payroll-periods", permission: "ver_liquidaciones" },
    { method: "POST", path: "/api/payroll-periods/:id/calculate", permission: "ver_liquidaciones" },
    { method: "GET", path: "/api/payroll-periods/:id/calculations", permission: "ver_liquidaciones" },
  ],
  exports: [
    { method: "POST", path: "/api/exports/excel", permission: "exportar_archivos" },
    { method: "POST", path: "/api/exports/pdf", permission: "exportar_archivos" },
    { method: "GET", path: "/api/exports/history", permission: "exportar_archivos" },
  ],
  notifications: [
    { method: "POST", path: "/api/notifications/payslips", permission: "enviar_whatsapp" },
    { method: "POST", path: "/api/notifications/schedules", permission: "enviar_whatsapp" },
    { method: "GET", path: "/api/notifications", permission: "enviar_whatsapp" },
  ],
};
