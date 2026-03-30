export type PayrollConfigSectionKey =
  | "company"
  | "overtime"
  | "social_security"
  | "benefits"
  | "novelties"
  | "compensation"
  | "organization";

export type PayrollModuleConfiguration = {
  company: {
    workdayType: string;
    restDayPolicy: string;
    approvalFlow: string;
    periodCutoff: string;
  };
  overtime: {
    enabled: boolean;
    requiresAuthorization: boolean;
    dailyCapHours: number;
    weeklyCapHours: number;
    nightSurchargeEnabled: boolean;
    sundayEnabled: boolean;
    festiveEnabled: boolean;
    source: string;
  };
  social_security: {
    enabled: boolean;
    healthEnabled: boolean;
    pensionEnabled: boolean;
    solidarityFundEnabled: boolean;
    parafiscalsEnabled: boolean;
    compensationFundEnabled: boolean;
    icbfEnabled: boolean;
    senaEnabled: boolean;
    defaultArlRiskClass: number;
  };
  benefits: {
    enabled: boolean;
    severanceEnabled: boolean;
    severanceInterestEnabled: boolean;
    serviceBonusEnabled: boolean;
    vacationAccrualEnabled: boolean;
    bonusEnabled: boolean;
    commissionsEnabled: boolean;
    deductionsEnabled: boolean;
  };
  novelties: {
    incapacityEnabled: boolean;
    incapacitySupportsRequired: boolean;
    vacationsEnabled: boolean;
    absencesEnabled: boolean;
    unjustifiedAbsenceDiscount: boolean;
    attendanceAdjustmentsEnabled: boolean;
    latenessTrackingEnabled: boolean;
  };
  compensation: {
    transportAllowanceEnabled: boolean;
    transportAllowanceMode: string;
    transportAllowanceProrated: boolean;
    bonusDefaultType: string;
    commissionSettlement: string;
    overtimePaymentMode: string;
  };
  organization: {
    seedDefaultPositions: boolean;
    seedDefaultDepartments: boolean;
    employeeOverridesEnabled: boolean;
    customConceptsEnabled: boolean;
    legalParametersEditable: boolean;
    multiAreaEmployeesEnabled: boolean;
  };
};

export type PayrollSettingsConfig = {
  mode?: string;
  country?: string;
  setup_mode?: string;
  setup_steps?: string[];
  initialized_from_demo?: boolean;
  modules: PayrollModuleConfiguration;
};

type PayrollSettingsConfigUpdate = Omit<Partial<PayrollSettingsConfig>, "modules"> & {
  modules?: Partial<PayrollModuleConfiguration>;
};

export const DEFAULT_PAYROLL_MODULE_CONFIGURATION: PayrollModuleConfiguration = {
  company: {
    workdayType: "ordinaria",
    restDayPolicy: "individual",
    approvalFlow: "company_admin",
    periodCutoff: "quincenal",
  },
  overtime: {
    enabled: true,
    requiresAuthorization: true,
    dailyCapHours: 2,
    weeklyCapHours: 12,
    nightSurchargeEnabled: true,
    sundayEnabled: true,
    festiveEnabled: true,
    source: "attendance_and_manual",
  },
  social_security: {
    enabled: true,
    healthEnabled: true,
    pensionEnabled: true,
    solidarityFundEnabled: true,
    parafiscalsEnabled: true,
    compensationFundEnabled: true,
    icbfEnabled: true,
    senaEnabled: true,
    defaultArlRiskClass: 1,
  },
  benefits: {
    enabled: true,
    severanceEnabled: true,
    severanceInterestEnabled: true,
    serviceBonusEnabled: true,
    vacationAccrualEnabled: true,
    bonusEnabled: true,
    commissionsEnabled: true,
    deductionsEnabled: true,
  },
  novelties: {
    incapacityEnabled: true,
    incapacitySupportsRequired: true,
    vacationsEnabled: true,
    absencesEnabled: true,
    unjustifiedAbsenceDiscount: true,
    attendanceAdjustmentsEnabled: true,
    latenessTrackingEnabled: true,
  },
  compensation: {
    transportAllowanceEnabled: true,
    transportAllowanceMode: "legal_threshold",
    transportAllowanceProrated: true,
    bonusDefaultType: "non_salary",
    commissionSettlement: "quincenal",
    overtimePaymentMode: "payroll_period",
  },
  organization: {
    seedDefaultPositions: true,
    seedDefaultDepartments: true,
    employeeOverridesEnabled: true,
    customConceptsEnabled: true,
    legalParametersEditable: true,
    multiAreaEmployeesEnabled: false,
  },
};

export const PAYROLL_CONFIGURATION_SECTIONS: {
  key: PayrollConfigSectionKey;
  title: string;
  description: string;
  route?: string;
}[] = [
  {
    key: "company",
    title: "Jornada y operación base",
    description: "Frecuencia de nómina, tipo de jornada, cortes y flujo general de aprobación.",
  },
  {
    key: "overtime",
    title: "Horas extras y recargos",
    description: "Topes, autorizaciones, trabajo dominical, festivo y recargo nocturno.",
    route: "/payroll/overtime",
  },
  {
    key: "social_security",
    title: "Seguridad social y parafiscales",
    description: "Salud, pensión, fondo de solidaridad, ARL, caja, ICBF y SENA.",
    route: "/payroll/legal-parameters",
  },
  {
    key: "benefits",
    title: "Prestaciones y pagos variables",
    description: "Cesantías, intereses, prima, vacaciones, bonificaciones y comisiones.",
    route: "/payroll/concepts",
  },
  {
    key: "novelties",
    title: "Novedades operativas",
    description: "Incapacidades, faltas, vacaciones, ajustes de asistencia y tardanzas.",
    route: "/payroll/novelties",
  },
  {
    key: "compensation",
    title: "Auxilios y liquidación complementaria",
    description: "Auxilio de transporte, prorrateos, liquidación de extras y descuentos.",
    route: "/payroll/deductions",
  },
  {
    key: "organization",
    title: "Cargos, áreas y reglas por empleado",
    description: "Estructura organizacional, personalización de catálogos y overrides.",
    route: "/payroll/employees",
  },
];

function toObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function resolvePayrollSettingsConfig(rawConfig: unknown): PayrollSettingsConfig {
  const base = toObject(rawConfig);
  const moduleOverrides = toObject(base.modules);

  return {
    mode: typeof base.mode === "string" ? base.mode : undefined,
    country: typeof base.country === "string" ? base.country : undefined,
    setup_mode: typeof base.setup_mode === "string" ? base.setup_mode : undefined,
    setup_steps: Array.isArray(base.setup_steps) ? base.setup_steps.map(String) : undefined,
    initialized_from_demo: Boolean(base.initialized_from_demo),
    modules: {
      company: {
        ...DEFAULT_PAYROLL_MODULE_CONFIGURATION.company,
        ...toObject(moduleOverrides.company),
      },
      overtime: {
        ...DEFAULT_PAYROLL_MODULE_CONFIGURATION.overtime,
        ...toObject(moduleOverrides.overtime),
      },
      social_security: {
        ...DEFAULT_PAYROLL_MODULE_CONFIGURATION.social_security,
        ...toObject(moduleOverrides.social_security),
      },
      benefits: {
        ...DEFAULT_PAYROLL_MODULE_CONFIGURATION.benefits,
        ...toObject(moduleOverrides.benefits),
      },
      novelties: {
        ...DEFAULT_PAYROLL_MODULE_CONFIGURATION.novelties,
        ...toObject(moduleOverrides.novelties),
      },
      compensation: {
        ...DEFAULT_PAYROLL_MODULE_CONFIGURATION.compensation,
        ...toObject(moduleOverrides.compensation),
      },
      organization: {
        ...DEFAULT_PAYROLL_MODULE_CONFIGURATION.organization,
        ...toObject(moduleOverrides.organization),
      },
    },
  };
}

export function buildPayrollSettingsConfig(
  currentConfig: unknown,
  updates: PayrollSettingsConfigUpdate,
): PayrollSettingsConfig {
  const current = resolvePayrollSettingsConfig(currentConfig);

  return {
    ...current,
    ...updates,
    modules: {
      ...current.modules,
      ...(updates.modules ?? {}),
      company: {
        ...current.modules.company,
        ...(updates.modules?.company ?? {}),
      },
      overtime: {
        ...current.modules.overtime,
        ...(updates.modules?.overtime ?? {}),
      },
      social_security: {
        ...current.modules.social_security,
        ...(updates.modules?.social_security ?? {}),
      },
      benefits: {
        ...current.modules.benefits,
        ...(updates.modules?.benefits ?? {}),
      },
      novelties: {
        ...current.modules.novelties,
        ...(updates.modules?.novelties ?? {}),
      },
      compensation: {
        ...current.modules.compensation,
        ...(updates.modules?.compensation ?? {}),
      },
      organization: {
        ...current.modules.organization,
        ...(updates.modules?.organization ?? {}),
      },
    },
  };
}
