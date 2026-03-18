export const WORKFORCE_STORAGE_KEY = "kaiko.workforce.v2";
export const WORKFORCE_SCHEMA_VERSION = 2;
export const CURRENT_DATE = "2026-03-18";
export const CURRENT_TIMESTAMP = `${CURRENT_DATE}T08:00:00`;

export const PERIOD_TYPES = [
  { id: "diario", label: "Diario" },
  { id: "semanal", label: "Semanal" },
  { id: "quincenal", label: "Quincenal" },
  { id: "mensual", label: "Mensual" },
];

export const PAYMENT_FREQUENCIES = [
  { id: "mensual", label: "Mensual" },
  { id: "quincenal", label: "Quincenal" },
  { id: "semanal", label: "Semanal" },
  { id: "diario", label: "Diario" },
];

export const CONTRACT_TYPES = [
  { id: "termino_indefinido", label: "Término indefinido" },
  { id: "termino_fijo", label: "Término fijo" },
  { id: "prestacion_servicios", label: "Prestación de servicios" },
  { id: "sin_contrato", label: "Sin contrato" },
  { id: "medio_tiempo", label: "Medio tiempo" },
  { id: "na", label: "N/A" },
];

export const EMPLOYEE_TYPE_DEFINITIONS = [
  {
    id: "management_confidence",
    label: "Administrador con manejo y confianza",
    description: "No liquida horas extras, pero sí recargos parametrizados.",
    defaults: {
      aplica_horas_extras: false,
      aplica_recargo_nocturno: true,
      aplica_recargo_dominical: true,
      aplica_recargo_festivo: true,
      aplica_recargo_nocturno_dominical: true,
      es_cargo_manejo_confianza: true,
      tipo_contrato: "termino_indefinido",
      horas_semanales_contratadas: 46,
      periodicidad_pago: "mensual",
    },
  },
  {
    id: "sin_contrato",
    label: "Personal sin contrato formal",
    description: "No liquida horas extras ni recargo nocturno.",
    defaults: {
      aplica_horas_extras: false,
      aplica_recargo_nocturno: false,
      aplica_recargo_dominical: true,
      aplica_recargo_festivo: true,
      aplica_recargo_nocturno_dominical: false,
      es_cargo_manejo_confianza: false,
      tipo_contrato: "sin_contrato",
      horas_semanales_contratadas: 46,
      periodicidad_pago: "quincenal",
    },
  },
  {
    id: "regular",
    label: "Empleado regular",
    description: "Liquida todos los conceptos según la regla vigente.",
    defaults: {
      aplica_horas_extras: true,
      aplica_recargo_nocturno: true,
      aplica_recargo_dominical: true,
      aplica_recargo_festivo: true,
      aplica_recargo_nocturno_dominical: true,
      es_cargo_manejo_confianza: false,
      tipo_contrato: "termino_indefinido",
      horas_semanales_contratadas: 46,
      periodicidad_pago: "mensual",
    },
  },
  {
    id: "turnero_30h",
    label: "Turnero / medio tiempo / 30 horas",
    description: "Jornada parcial con turnos específicos.",
    defaults: {
      aplica_horas_extras: true,
      aplica_recargo_nocturno: true,
      aplica_recargo_dominical: true,
      aplica_recargo_festivo: true,
      aplica_recargo_nocturno_dominical: true,
      es_cargo_manejo_confianza: false,
      tipo_contrato: "medio_tiempo",
      horas_semanales_contratadas: 30,
      periodicidad_pago: "quincenal",
    },
  },
  {
    id: "vacante",
    label: "Vacante o cargo pendiente",
    description: "Registro de posición sin persona asignada.",
    defaults: {
      aplica_horas_extras: false,
      aplica_recargo_nocturno: false,
      aplica_recargo_dominical: false,
      aplica_recargo_festivo: false,
      aplica_recargo_nocturno_dominical: false,
      es_cargo_manejo_confianza: false,
      tipo_contrato: "na",
      horas_semanales_contratadas: 0,
      periodicidad_pago: "mensual",
      estado: "inactivo",
    },
  },
];

export const ROLE_DEFINITIONS = [
  {
    id: "admin",
    label: "Administrador del sistema",
    permissions: [
      "ver_empleados",
      "crear_empleados",
      "editar_empleados",
      "eliminar_empleados",
      "ver_horarios",
      "asignar_horarios",
      "ver_liquidaciones",
      "exportar_archivos",
      "enviar_whatsapp",
      "ver_auditoria",
    ],
  },
  {
    id: "rrhh",
    label: "RRHH / Nómina",
    permissions: [
      "ver_empleados",
      "crear_empleados",
      "editar_empleados",
      "ver_horarios",
      "asignar_horarios",
      "ver_liquidaciones",
      "exportar_archivos",
      "enviar_whatsapp",
      "ver_auditoria",
    ],
  },
  {
    id: "supervisor",
    label: "Supervisor",
    permissions: [
      "ver_empleados",
      "ver_horarios",
      "asignar_horarios",
      "ver_liquidaciones",
      "exportar_archivos",
      "enviar_whatsapp",
    ],
  },
  {
    id: "lectura",
    label: "Solo lectura",
    permissions: ["ver_empleados", "ver_horarios", "ver_liquidaciones"],
  },
];

export const NOVELTY_TYPES = [
  { id: "normal", label: "Normal" },
  { id: "ausencia", label: "Ausencia" },
  { id: "incapacidad", label: "Incapacidad" },
  { id: "permiso", label: "Permiso" },
  { id: "descanso_compensatorio", label: "Descanso compensatorio" },
  { id: "cambio_turno", label: "Cambio de turno" },
  { id: "ingreso_tardio", label: "Ingreso tardío" },
  { id: "salida_anticipada", label: "Salida anticipada" },
];

export const SEND_STATUS = [
  { id: "pendiente", label: "Pendiente" },
  { id: "enviado", label: "Enviado" },
  { id: "error", label: "Error" },
];

export const WEEK_DAYS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

export const SCHEDULE_TEMPLATES = [
  {
    id: "general_regular",
    name: "Horario general restaurante",
    type: "regular",
    blocks: {
      lunes: [{ start: "08:00", end: "20:00" }],
      martes: [{ start: "08:00", end: "20:00" }],
      miercoles: [{ start: "08:00", end: "20:00" }],
      jueves: [{ start: "08:00", end: "20:00" }],
      viernes: [{ start: "08:00", end: "20:00" }],
      sabado: [{ start: "08:00", end: "20:00" }],
      domingo: [
        { start: "08:00", end: "12:00" },
        { start: "14:00", end: "19:00" },
      ],
    },
  },
  {
    id: "administrativo",
    name: "Administrativo flexible",
    type: "administrativo",
    blocks: {
      lunes: [{ start: "08:00", end: "18:00" }],
      martes: [{ start: "08:00", end: "18:00" }],
      miercoles: [{ start: "08:00", end: "18:00" }],
      jueves: [{ start: "08:00", end: "18:00" }],
      viernes: [{ start: "08:00", end: "18:00" }],
      sabado: [{ start: "08:00", end: "13:00" }],
      domingo: [],
    },
  },
  {
    id: "turnero_30h",
    name: "Turnero 30 horas",
    type: "parcial",
    blocks: {
      lunes: [{ start: "10:00", end: "16:00" }],
      martes: [{ start: "10:00", end: "16:00" }],
      miercoles: [{ start: "10:00", end: "16:00" }],
      jueves: [{ start: "10:00", end: "16:00" }],
      viernes: [{ start: "10:00", end: "16:00" }],
      sabado: [{ start: "08:00", end: "14:00" }],
      domingo: [],
    },
  },
];

let sequence = 0;

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function stampRecord(base) {
  return {
    created_at: CURRENT_TIMESTAMP,
    updated_at: CURRENT_TIMESTAMP,
    deleted_at: null,
    ...base,
  };
}

export function createId(prefix) {
  sequence += 1;
  return `${prefix}_${CURRENT_DATE.replace(/-/g, "")}_${String(sequence).padStart(4, "0")}`;
}

function withNames(fullName) {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return {
      nombres: "",
      apellidos: "",
      nombre_completo: "",
    };
  }

  return {
    nombres: parts.slice(0, -1).join(" ") || parts[0],
    apellidos: parts.length > 1 ? parts.at(-1) : "",
    nombre_completo: fullName,
  };
}

function createEmployee(base) {
  return stampRecord({
    id: createId("emp"),
    estado: "activo",
    fecha_ingreso: "2025-01-01",
    tipo_empleado: "regular",
    tipo_contrato: "termino_indefinido",
    periodicidad_pago: "mensual",
    salario_base: 0,
    bono_mensual: 0,
    auxilio_transporte: 0,
    horas_semanales_contratadas: 46,
    aplica_horas_extras: true,
    aplica_recargo_nocturno: true,
    aplica_recargo_dominical: true,
    aplica_recargo_festivo: true,
    aplica_recargo_nocturno_dominical: true,
    es_cargo_manejo_confianza: false,
    dia_descanso: "domingo",
    telefono: "",
    observaciones: "",
    notas_liquidacion: "",
    descuentos_fijos: 0,
    ...base,
  });
}

function seedEmployees() {
  return [
    createEmployee({
      ...withNames("HEINER BARÓN"),
      cargo: "Administrador",
      telefono: "3212162127",
      tipo_empleado: "management_confidence",
      salario_base: 2200000,
      auxilio_transporte: 200000,
      periodicidad_pago: "mensual",
      aplica_horas_extras: false,
      aplica_recargo_nocturno: true,
      aplica_recargo_dominical: true,
      aplica_recargo_festivo: true,
      aplica_recargo_nocturno_dominical: true,
      es_cargo_manejo_confianza: true,
      dia_descanso: "lunes",
      observaciones:
        "Contrato de manejo y confianza: no genera horas extras, pero sí recargo nocturno y dominical.",
      notas_liquidacion: "No aplicar horas extras.",
    }),
    createEmployee({
      ...withNames("DAVID"),
      cargo: "Operación sin contrato",
      telefono: "3000000000",
      tipo_empleado: "sin_contrato",
      tipo_contrato: "sin_contrato",
      salario_base: 1000000,
      periodicidad_pago: "quincenal",
      bono_mensual: 300000,
      aplica_horas_extras: false,
      aplica_recargo_nocturno: false,
      aplica_recargo_dominical: true,
      aplica_recargo_festivo: true,
      aplica_recargo_nocturno_dominical: false,
      dia_descanso: "domingo",
      observaciones:
        "No tiene contrato; no se liquidan horas extras ni recargo nocturno, pero sí dominical.",
      notas_liquidacion: "Liquidación dominical permitida.",
    }),
    createEmployee({
      ...withNames("ARLEY GIL"),
      cargo: "Jefe de cocina",
      telefono: "3155946351",
      salario_base: 2500000,
      dia_descanso: "domingo",
    }),
    createEmployee({
      ...withNames("DAVID GUERRERO"),
      cargo: "Aux. cocina",
      telefono: "3128474224",
      salario_base: 1700000,
      dia_descanso: "jueves",
    }),
    createEmployee({
      ...withNames("MIGUEL BRICEÑO"),
      cargo: "Cocinero",
      telefono: "3174864441",
      salario_base: 1900000,
      dia_descanso: "lunes",
    }),
    createEmployee({
      ...withNames("HANMARIS BERMÚDEZ"),
      cargo: "Repostera",
      telefono: "3115918118",
      salario_base: 1800000,
      dia_descanso: "jueves",
    }),
    createEmployee({
      ...withNames("JOHANNA LEON"),
      cargo: "Anfitriona",
      telefono: "3224070410",
      salario_base: 1600000,
      dia_descanso: "lunes",
    }),
    createEmployee({
      ...withNames("MARLIN LUNA"),
      cargo: "Anfitriona",
      telefono: "3204022889",
      salario_base: 1600000,
      dia_descanso: "martes",
    }),
    createEmployee({
      ...withNames("BREINER ALVARADO"),
      cargo: "Asis. admn",
      telefono: "3024002580",
      salario_base: 1850000,
      dia_descanso: "domingo",
    }),
    createEmployee({
      ...withNames("JIMENA ROBLES"),
      cargo: "Ventas online",
      telefono: "3212628648",
      salario_base: 1650000,
      dia_descanso: "domingo",
    }),
    createEmployee({
      ...withNames("LISAY ÁNGEL"),
      cargo: "Caja",
      telefono: "3008669462",
      salario_base: 1700000,
      dia_descanso: "sabado",
    }),
    createEmployee({
      ...withNames("DARA"),
      cargo: "Anfitriona turnera",
      telefono: "3143451207",
      tipo_empleado: "turnero_30h",
      tipo_contrato: "medio_tiempo",
      periodicidad_pago: "quincenal",
      salario_base: 950000,
      horas_semanales_contratadas: 30,
      dia_descanso: "domingo",
      observaciones: "Turnera de 30 horas semanales.",
    }),
    createEmployee({
      ...withNames("N/A"),
      cargo: "Caja turnero",
      telefono: "",
      tipo_empleado: "vacante",
      tipo_contrato: "na",
      salario_base: 0,
      horas_semanales_contratadas: 8,
      estado: "inactivo",
      dia_descanso: "domingo",
      observaciones: "Vacante. Solo trabaja sábado cuando se asigne.",
    }),
  ];
}

function seedScheduleAssignments(employees) {
  return employees.map((employee) =>
    stampRecord({
      id: createId("asg"),
      employee_id: employee.id,
      template_id:
        employee.tipo_empleado === "turnero_30h"
          ? "turnero_30h"
          : employee.tipo_empleado === "management_confidence"
            ? "administrativo"
            : "general_regular",
      start_date: "2026-03-16",
      end_date: "2026-03-31",
      rest_day: employee.dia_descanso,
      override_rest_day: false,
      is_active: true,
      notes: "Asignación inicial del sistema.",
    }),
  );
}

function seedAttendance(employees) {
  const employeeMap = Object.fromEntries(employees.map((employee) => [employee.nombre_completo, employee]));

  return [
    {
      employee_id: employeeMap["HEINER BARÓN"]?.id,
      date: "2026-03-16",
      ordinary_hours: 8,
      extra_day_hours: 0,
      extra_night_hours: 1,
      night_surcharge_hours: 2,
      sunday_hours: 0,
      festive_hours: 0,
      sunday_night_hours: 0,
      novelty_type: "normal",
      notes: "Cierre administrativo nocturno.",
      source: "seed",
    },
    {
      employee_id: employeeMap["DAVID"]?.id,
      date: "2026-03-17",
      ordinary_hours: 8,
      extra_day_hours: 2,
      extra_night_hours: 1,
      night_surcharge_hours: 2,
      sunday_hours: 0,
      festive_hours: 0,
      sunday_night_hours: 0,
      novelty_type: "normal",
      notes: "Se validará por regla de sin contrato.",
      source: "seed",
    },
    {
      employee_id: employeeMap["ARLEY GIL"]?.id,
      date: "2026-03-17",
      ordinary_hours: 8,
      extra_day_hours: 2,
      extra_night_hours: 1,
      night_surcharge_hours: 1,
      sunday_hours: 0,
      festive_hours: 0,
      sunday_night_hours: 0,
      novelty_type: "normal",
      notes: "Producción extendida.",
      source: "seed",
    },
    {
      employee_id: employeeMap["JOHANNA LEON"]?.id,
      date: "2026-03-18",
      ordinary_hours: 8,
      extra_day_hours: 0,
      extra_night_hours: 0,
      night_surcharge_hours: 3,
      sunday_hours: 0,
      festive_hours: 0,
      sunday_night_hours: 0,
      novelty_type: "ingreso_tardio",
      notes: "Ingreso tardío compensado con cierre.",
      source: "seed",
    },
    {
      employee_id: employeeMap["MIGUEL BRICEÑO"]?.id,
      date: "2026-03-21",
      ordinary_hours: 8,
      extra_day_hours: 1,
      extra_night_hours: 0,
      night_surcharge_hours: 0,
      sunday_hours: 0,
      festive_hours: 0,
      sunday_night_hours: 0,
      novelty_type: "normal",
      notes: "Servicio extendido.",
      source: "seed",
    },
    {
      employee_id: employeeMap["LISAY ÁNGEL"]?.id,
      date: "2026-03-22",
      ordinary_hours: 4,
      extra_day_hours: 0,
      extra_night_hours: 0,
      night_surcharge_hours: 0,
      sunday_hours: 4,
      festive_hours: 0,
      sunday_night_hours: 0,
      novelty_type: "normal",
      notes: "Caja en jornada dominical.",
      source: "seed",
    },
    {
      employee_id: employeeMap["DARA"]?.id,
      date: "2026-03-20",
      ordinary_hours: 6,
      extra_day_hours: 0,
      extra_night_hours: 0,
      night_surcharge_hours: 1,
      sunday_hours: 0,
      festive_hours: 0,
      sunday_night_hours: 0,
      novelty_type: "cambio_turno",
      notes: "Turno parcial con cierre.",
      source: "seed",
    },
  ]
    .filter((item) => item.employee_id)
    .map((item) =>
      stampRecord({
        id: createId("att"),
        ...item,
      }),
    );
}

function seedPayrollPeriods() {
  return [
    stampRecord({
      id: createId("period"),
      label: "Primera quincena marzo 2026",
      period_type: "quincenal",
      start_date: "2026-03-01",
      end_date: "2026-03-15",
      status: "cerrado",
    }),
    stampRecord({
      id: createId("period"),
      label: "Segunda quincena marzo 2026",
      period_type: "quincenal",
      start_date: "2026-03-16",
      end_date: "2026-03-31",
      status: "abierto",
    }),
  ];
}

export function createSeedDatabase() {
  sequence = 0;
  const employees = seedEmployees();

  return deepClone({
    meta: {
      version: WORKFORCE_SCHEMA_VERSION,
      created_at: CURRENT_TIMESTAMP,
      updated_at: CURRENT_TIMESTAMP,
    },
    employee_types: EMPLOYEE_TYPE_DEFINITIONS,
    roles: ROLE_DEFINITIONS,
    users: [
      stampRecord({
        id: createId("usr"),
        name: "Administrador principal",
        email: "admin@sandeli.com",
        role_id: "admin",
      }),
    ],
    employees,
    employee_contract_rules: employees.map((employee) =>
      stampRecord({
        id: createId("rule"),
        employee_id: employee.id,
        tipo_contrato: employee.tipo_contrato,
        aplica_horas_extras: employee.aplica_horas_extras,
        aplica_recargo_nocturno: employee.aplica_recargo_nocturno,
        aplica_recargo_dominical: employee.aplica_recargo_dominical,
        aplica_recargo_festivo: employee.aplica_recargo_festivo,
        aplica_recargo_nocturno_dominical: employee.aplica_recargo_nocturno_dominical,
        es_cargo_manejo_confianza: employee.es_cargo_manejo_confianza,
      }),
    ),
    employee_payment_config: employees.map((employee) =>
      stampRecord({
        id: createId("pay"),
        employee_id: employee.id,
        periodicidad_pago: employee.periodicidad_pago,
        salario_base: employee.salario_base,
        bono_mensual: employee.bono_mensual,
        auxilio_transporte: employee.auxilio_transporte,
        horas_semanales_contratadas: employee.horas_semanales_contratadas,
      }),
    ),
    schedules: deepClone(SCHEDULE_TEMPLATES),
    schedule_assignments: seedScheduleAssignments(employees),
    attendance_logs: seedAttendance(employees),
    payroll_periods: seedPayrollPeriods(),
    payroll_calculations: [],
    payroll_calculation_details: [],
    bonuses: [],
    transport_allowances: [],
    notifications: [],
    exports_history: [],
    audit_logs: [],
  });
}
