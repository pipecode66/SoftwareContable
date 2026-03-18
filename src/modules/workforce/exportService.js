import { formatCurrency, formatNumber, normalizeText } from "../../lib/overtime";

function buildScheduleLabel(item) {
  if (!item.schedule) {
    return "Sin horario";
  }

  return item.schedule.name;
}

function buildExportRows(dataset) {
  return dataset.map((item) => ({
    nombre_empleado: item.employee?.nombre_completo || "Sin nombre",
    cargo: item.employee?.cargo || "Sin cargo",
    telefono: item.employee?.telefono || "Sin teléfono",
    horario_asignado: buildScheduleLabel(item),
    dias_trabajados: item.attendance_summary.worked_days,
    dia_descanso: item.assignment?.rest_day || item.employee?.dia_descanso || "No definido",
    horas_extras: item.calculation?.extra_hours || 0,
    recargo_nocturno: item.attendance_summary.night_hours || 0,
    dominicales: item.attendance_summary.sunday_hours || 0,
    festivos: item.attendance_summary.festive_hours || 0,
    bono: item.calculation?.bonuses_value || 0,
    auxilio_transporte: item.calculation?.transport_value || 0,
    total_liquidado_periodo: item.calculation?.total_pay || 0,
  }));
}

function buildExcelSheetData(dataset) {
  const rows = buildExportRows(dataset);

  return [
    [
      { value: "Empleado", fontWeight: "bold" },
      { value: "Cargo", fontWeight: "bold" },
      { value: "Teléfono", fontWeight: "bold" },
      { value: "Horario asignado", fontWeight: "bold" },
      { value: "Días trabajados", fontWeight: "bold" },
      { value: "Día de descanso", fontWeight: "bold" },
      { value: "Horas extras", fontWeight: "bold" },
      { value: "Recargo nocturno", fontWeight: "bold" },
      { value: "Dominicales", fontWeight: "bold" },
      { value: "Festivos", fontWeight: "bold" },
      { value: "Bono", fontWeight: "bold" },
      { value: "Auxilio transporte", fontWeight: "bold" },
      { value: "Total liquidado", fontWeight: "bold" },
    ],
    ...rows.map((row) => [
      { value: row.nombre_empleado, type: String },
      { value: row.cargo, type: String },
      { value: row.telefono, type: String },
      { value: row.horario_asignado, type: String },
      { value: row.dias_trabajados, type: Number },
      { value: row.dia_descanso, type: String },
      { value: row.horas_extras, type: Number },
      { value: row.recargo_nocturno, type: Number },
      { value: row.dominicales, type: Number },
      { value: row.festivos, type: Number },
      { value: row.bono, type: Number },
      { value: row.auxilio_transporte, type: Number },
      { value: row.total_liquidado_periodo, type: Number },
    ]),
  ];
}

export async function exportDatasetToExcel(dataset, fileNameBase) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");

  await writeXlsxFile([buildExcelSheetData(dataset)], {
    sheets: ["Liquidación"],
    fileName: `${normalizeText(fileNameBase) || "kaiko-liquidacion"}.xlsx`,
  });
}

export async function exportDatasetToPdf(dataset, metadata) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  doc.setFontSize(20);
  doc.setTextColor(...metadata.brandRgb);
  doc.text(metadata.brandName, 40, 42);

  doc.setFontSize(11);
  doc.setTextColor(60, 45, 76);
  doc.text(metadata.title, 40, 64);
  doc.text(metadata.subtitle, 40, 82);

  autoTable(doc, {
    startY: 110,
    head: [[
      "Empleado",
      "Cargo",
      "Teléfono",
      "Horario",
      "Días",
      "Descanso",
      "Extras",
      "Nocturno",
      "Dominicales",
      "Festivos",
      "Bono",
      "Auxilio",
      "Total",
    ]],
    body: buildExportRows(dataset).map((row) => [
      row.nombre_empleado,
      row.cargo,
      row.telefono,
      row.horario_asignado,
      formatNumber(row.dias_trabajados, 0),
      row.dia_descanso,
      formatNumber(row.horas_extras),
      formatNumber(row.recargo_nocturno),
      formatNumber(row.dominicales),
      formatNumber(row.festivos),
      formatCurrency(row.bono),
      formatCurrency(row.auxilio_transporte),
      formatCurrency(row.total_liquidado_periodo),
    ]),
    headStyles: {
      fillColor: metadata.brandRgb,
    },
    styles: {
      fontSize: 8,
    },
  });

  doc.save(`${normalizeText(metadata.fileNameBase) || "kaiko-liquidacion"}.pdf`);
}

export async function exportPayslipToPdf(payslip, metadata) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  doc.setFontSize(22);
  doc.setTextColor(...metadata.brandRgb);
  doc.text(metadata.brandName, 40, 44);

  doc.setFontSize(11);
  doc.setTextColor(60, 45, 76);
  doc.text("Tirilla de pago", 40, 68);
  doc.text(`Período: ${payslip.period_label}`, 40, 86);
  doc.text(`Empleado: ${payslip.employee_name}`, 40, 102);
  doc.text(`Cargo: ${payslip.position}`, 40, 118);
  doc.text(`Teléfono: ${payslip.phone || "Sin teléfono"}`, 40, 134);

  autoTable(doc, {
    startY: 160,
    head: [["Concepto", "Valor"]],
    body: [
      ["Salario base", formatCurrency(payslip.base_salary_period)],
      ["Bono", formatCurrency(payslip.bonus)],
      ["Auxilio transporte", formatCurrency(payslip.transport_allowance)],
      ["Descuentos", formatCurrency(payslip.discounts || 0)],
      ["Horas extras", formatCurrency(payslip.overtime_value)],
      ["Recargos", formatCurrency(payslip.surcharge_value)],
      ["Total a pagar", formatCurrency(payslip.total_pay)],
    ],
    headStyles: {
      fillColor: metadata.brandRgb,
    },
    styles: {
      fontSize: 10,
    },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 18,
    head: [["Detalle", "Código", "Cantidad", "Valor"]],
    body: payslip.detail_lines.map((line) => [
      line.label,
      line.code,
      formatNumber(line.quantity),
      formatCurrency(line.total),
    ]),
    headStyles: {
      fillColor: metadata.brandRgb,
    },
    styles: {
      fontSize: 9,
    },
  });

  doc.save(`${normalizeText(metadata.fileNameBase) || "tirilla-kaiko"}.pdf`);
}
