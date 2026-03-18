function createStubProvider(providerName) {
  return {
    name: providerName,
    async sendMessage(payload) {
      const to = String(payload.to || "").trim();

      if (!/^\d{10}$/.test(to)) {
        throw new Error("El número de WhatsApp no es válido para el envío.");
      }

      return {
        provider: providerName,
        status: "enviado",
        external_id: `${providerName}_${Date.now()}`,
        delivered_at: new Date().toISOString(),
      };
    },
  };
}

export function createWhatsAppService(provider = "stub") {
  switch (provider) {
    case "cloud_api":
      return createStubProvider("whatsapp_cloud_api");
    case "twilio":
      return createStubProvider("twilio_whatsapp");
    default:
      return createStubProvider("stub_whatsapp");
  }
}

export function buildPayslipMessage(employee, period, payslip) {
  return [
    `Hola ${employee.nombre_completo}.`,
    `Tu tirilla de pago de ${period.label} está lista.`,
    `Cargo: ${employee.cargo}.`,
    `Total a pagar: ${new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(payslip.total_pay || 0)}.`,
    "Este envío fue generado desde KAIKO.",
  ].join(" ");
}

export function buildScheduleMessage(employee, assignment, schedule) {
  return [
    `Hola ${employee.nombre_completo}.`,
    `Tu horario individual entre ${assignment.start_date} y ${assignment.end_date} corresponde a ${schedule.name}.`,
    `Día de descanso: ${assignment.rest_day}.`,
    "Consulta cualquier cambio con tu supervisor.",
  ].join(" ");
}
