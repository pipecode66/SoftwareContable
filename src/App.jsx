import { useDeferredValue, useEffect, useState, useTransition } from "react";
import readXlsxFile from "read-excel-file/browser";
import "./App.css";
import {
  DEFAULT_SETTINGS,
  FIELD_DEFINITIONS,
  SAMPLE_ROWS,
  buildEmployees,
  buildOperationalAlerts,
  detectColumnMap,
  formatCurrency,
  formatNumber,
  getNightShiftStartHour,
  getWeeklyHours,
  normalizeText,
  summarizeByConcept,
  summarizeEmployees,
} from "./lib/overtime";

const STORAGE_KEYS = {
  session: "kaiko.session",
  settings: "kaiko.settings",
};

const BRAND_NAME = "KAIKO";
const BRAND_RGB = [159, 31, 239];

const APP_CREDENTIALS = {
  email: "admin@sandeli.com",
  password: "sandeli12@",
};

function loadStorage(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function getObjectRows(sheetRows) {
  const [rawHeaders = [], ...bodyRows] = sheetRows;
  const usedHeaders = new Map();

  const headers = rawHeaders.map((header, index) => {
    const baseHeader = String(header || `columna_${index + 1}`).trim() || `columna_${index + 1}`;
    const count = usedHeaders.get(baseHeader) || 0;
    usedHeaders.set(baseHeader, count + 1);
    return count === 0 ? baseHeader : `${baseHeader}_${count + 1}`;
  });

  return bodyRows
    .filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""))
    .map((row) =>
      Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])),
    );
}

function buildExportBaseName(fileName) {
  const rawName = String(fileName || "kaiko-horas-extras")
    .replace(/\.[^.]+$/, "")
    .trim();

  return normalizeText(rawName) || "kaiko-horas-extras";
}

function buildSummarySheet(summary, fileName, contextDate) {
  return [
    [BRAND_NAME, "Resumen general"],
    [],
    ["Archivo base", fileName],
    ["Fecha de referencia", contextDate],
    ["Personas liquidadas", summary.totalEmployees],
    ["Horas extra acumuladas", Number(summary.totalOvertimeHours.toFixed(2))],
    ["Recargos acumulados", Number(summary.totalSurchargeHours.toFixed(2))],
    ["Valor total estimado", Math.round(summary.totalValue)],
  ];
}

function buildEmployeesSheet(employees) {
  return [
    [
      "Empleado",
      "Documento",
      "Código interno",
      "Período",
      "Salario base",
      "Valor hora",
      "Horas extra",
      "Recargos",
      "Total",
    ],
    ...employees.map((employee) => [
      employee.employeeName || "Sin nombre",
      employee.documentNumber || "",
      employee.internalCode || "",
      employee.periodDate,
      Math.round(employee.baseSalary || 0),
      Math.round(employee.hourlyRate || 0),
      Number(employee.overtimeHours.toFixed(2)),
      Number(employee.surchargeHours.toFixed(2)),
      Math.round(employee.totalValue),
    ]),
  ];
}

function buildConceptSheet(conceptSummary) {
  return [
    ["Código", "Concepto", "Cantidad", "Valor total"],
    ...conceptSummary.map((item) => [
      item.short,
      item.label,
      Number(item.quantity.toFixed(2)),
      Math.round(item.totalValue),
    ]),
  ];
}

function buildSelectedEmployeeSheet(employee) {
  return [
    ["Empleado", employee.employeeName || "Sin nombre"],
    ["Documento", employee.documentNumber || ""],
    ["Código interno", employee.internalCode || ""],
    ["Período", employee.periodDate],
    ["Salario base", Math.round(employee.baseSalary || 0)],
    ["Valor hora", Math.round(employee.hourlyRate || 0)],
    ["Horas extra", Number(employee.overtimeHours.toFixed(2))],
    ["Recargos", Number(employee.surchargeHours.toFixed(2))],
    ["Total", Math.round(employee.totalValue)],
    [],
    ["Concepto", "Código", "Cantidad", "Multiplicador", "Valor unitario", "Valor total"],
    ...employee.breakdown.map((line) => [
      line.label,
      line.short,
      Number(line.quantity.toFixed(2)),
      Number(line.multiplier.toFixed(2)),
      Math.round(line.unitValue),
      Math.round(line.totalValue),
    ]),
  ];
}

function App() {
  const [session, setSession] = useState(() =>
    loadStorage(STORAGE_KEYS.session, {
      isAuthenticated: false,
      email: "",
    }),
  );
  const [settings, setSettings] = useState(() =>
    loadStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
  );
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [loginError, setLoginError] = useState("");
  const [rows, setRows] = useState(SAMPLE_ROWS);
  const [mapping, setMapping] = useState(() =>
    detectColumnMap(Object.keys(SAMPLE_ROWS[0] || {})),
  );
  const [fileName, setFileName] = useState("demo-base-horas-extras.xlsx");
  const [importError, setImportError] = useState("");
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState({
    type: "info",
    message: "Base demo cargada. Puedes importar Excel o trabajar con el ejemplo inicial.",
  });
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    saveStorage(STORAGE_KEYS.session, session);
  }, [session]);

  useEffect(() => {
    saveStorage(STORAGE_KEYS.settings, settings);
  }, [settings]);

  useEffect(() => {
    startTransition(() => {
      const nextEmployees = buildEmployees(rows, mapping, settings);
      setEmployees(nextEmployees);

      if (!nextEmployees.some((employee) => employee.id === selectedEmployeeId)) {
        setSelectedEmployeeId(nextEmployees[0]?.id || "");
      }
    });
  }, [mapping, rows, selectedEmployeeId, settings, startTransition]);

  const headers = Object.keys(rows[0] || {});
  const selectedEmployee =
    employees.find((employee) => employee.id === selectedEmployeeId) || null;
  const contextDate =
    selectedEmployee?.periodDate || settings.periodDate || DEFAULT_SETTINGS.periodDate;
  const summary = summarizeEmployees(employees);
  const conceptSummary = summarizeByConcept(employees);
  const alerts = buildOperationalAlerts(employees);

  const filteredEmployees = employees.filter((employee) => {
    const searchValue = normalizeText(deferredSearch);

    if (!searchValue) {
      return true;
    }

    return (
      normalizeText(employee.employeeName).includes(searchValue) ||
      normalizeText(employee.documentNumber).includes(searchValue) ||
      normalizeText(employee.internalCode).includes(searchValue)
    );
  });

  function showNotice(message, type = "info") {
    setNotice({ message, type });
  }

  function updateSettings(field, value) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  function handleLocalLogin(event) {
    event.preventDefault();

    const normalizedEmail = loginForm.email.trim().toLowerCase();
    const password = loginForm.password;

    if (
      normalizedEmail === APP_CREDENTIALS.email &&
      password === APP_CREDENTIALS.password
    ) {
      setSession({
        isAuthenticated: true,
        email: normalizedEmail,
      });
      setLoginError("");
      setLoginForm({
        email: "",
        password: "",
      });
      showNotice(`Sesión iniciada correctamente en ${BRAND_NAME}.`, "success");
      return;
    }

    setLoginError("Credenciales inválidas. Verifica el usuario y la contraseña.");
  }

  function handleLocalLogout() {
    setSession({
      isAuthenticated: false,
      email: "",
    });
  }

  async function runAction(label, task) {
    try {
      await task();
    } catch (error) {
      const message = error.message || `No fue posible completar ${label}.`;

      if (label === "importar Excel") {
        setImportError(message);
      }

      showNotice(message, "error");
    }
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    await runAction("importar Excel", async () => {
      const sheetRows = await readXlsxFile(file);
      const objectRows = getObjectRows(sheetRows);

      if (!objectRows.length) {
        throw new Error("El archivo no tiene filas útiles para procesar.");
      }

      const detectedMapping = detectColumnMap(Object.keys(objectRows[0]));
      setImportError("");
      setFileName(file.name);

      startTransition(() => {
        setRows(objectRows);
        setMapping(detectedMapping);
      });

      showNotice(
        `Base importada desde ${file.name}. Se detectaron ${objectRows.length} filas.`,
        "success",
      );
    });

    event.target.value = "";
  }

  function handleLoadDemo() {
    startTransition(() => {
      setRows(SAMPLE_ROWS);
      setMapping(detectColumnMap(Object.keys(SAMPLE_ROWS[0] || {})));
      setFileName("demo-base-horas-extras.xlsx");
      setSelectedEmployeeId("");
    });

    setImportError("");
    showNotice("Se restauró la base demo con personas de referencia.", "info");
  }

  function handleClearImport() {
    startTransition(() => {
      setRows([]);
      setMapping({});
      setSelectedEmployeeId("");
    });

    setFileName("sin-archivo");
    setImportError("");
    showNotice("La base actual fue limpiada. Puedes importar un nuevo Excel.", "info");
  }

  async function handleExportExcel() {
    if (!employees.length) {
      showNotice("No hay datos procesados para exportar a Excel.", "warning");
      return;
    }

    await runAction("exportar Excel", async () => {
      const { default: writeXlsxFile } = await import("write-excel-file/browser");
      const workbookData = [
        buildSummarySheet(summary, fileName, contextDate),
        buildEmployeesSheet(employees),
        buildConceptSheet(conceptSummary),
      ];
      const sheetNames = ["Resumen", "Personas", "Conceptos"];

      if (selectedEmployee) {
        workbookData.push(buildSelectedEmployeeSheet(selectedEmployee));
        sheetNames.push("Detalle persona");
      }

      await writeXlsxFile(workbookData, {
        sheets: sheetNames,
        fileName: `${buildExportBaseName(fileName)}-kaiko.xlsx`,
      });

      showNotice("La exportación en Excel fue generada correctamente.", "success");
    });
  }

  async function handleExportPdf() {
    if (!employees.length) {
      showNotice("No hay datos procesados para exportar a PDF.", "warning");
      return;
    }

    await runAction("exportar PDF", async () => {
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
      doc.setTextColor(...BRAND_RGB);
      doc.text(BRAND_NAME, 40, 42);

      doc.setFontSize(11);
      doc.setTextColor(60, 45, 76);
      doc.text("Reporte de horas extras y recargos", 40, 64);
      doc.text(`Archivo base: ${fileName}`, 40, 82);
      doc.text(`Fecha de referencia: ${contextDate}`, 40, 98);

      autoTable(doc, {
        startY: 120,
        head: [["Indicador", "Valor"]],
        body: [
          ["Personas liquidadas", formatNumber(summary.totalEmployees, 0)],
          ["Horas extra acumuladas", formatNumber(summary.totalOvertimeHours)],
          ["Recargos acumulados", formatNumber(summary.totalSurchargeHours)],
          ["Valor total estimado", formatCurrency(summary.totalValue)],
        ],
        headStyles: {
          fillColor: BRAND_RGB,
        },
        styles: {
          fontSize: 10,
        },
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 18,
        head: [[
          "Empleado",
          "Documento",
          "Código",
          "Período",
          "Horas extra",
          "Recargos",
          "Total",
        ]],
        body: employees.map((employee) => [
          employee.employeeName || "Sin nombre",
          employee.documentNumber || "",
          employee.internalCode || "",
          employee.periodDate,
          formatNumber(employee.overtimeHours),
          formatNumber(employee.surchargeHours),
          formatCurrency(employee.totalValue),
        ]),
        headStyles: {
          fillColor: BRAND_RGB,
        },
        styles: {
          fontSize: 9,
        },
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 18,
        head: [["Código", "Concepto", "Cantidad", "Valor"]],
        body: conceptSummary.map((item) => [
          item.short,
          item.label,
          formatNumber(item.quantity),
          formatCurrency(item.totalValue),
        ]),
        headStyles: {
          fillColor: BRAND_RGB,
        },
        styles: {
          fontSize: 9,
        },
      });

      if (selectedEmployee) {
        doc.addPage();
        doc.setFontSize(18);
        doc.setTextColor(...BRAND_RGB);
        doc.text(selectedEmployee.employeeName || "Detalle de persona", 40, 42);

        doc.setFontSize(11);
        doc.setTextColor(60, 45, 76);
        doc.text(`Documento: ${selectedEmployee.documentNumber || "Sin documento"}`, 40, 64);
        doc.text(`Código interno: ${selectedEmployee.internalCode || "Sin código"}`, 40, 80);
        doc.text(`Período: ${selectedEmployee.periodDate}`, 40, 96);

        autoTable(doc, {
          startY: 120,
          head: [[
            "Concepto",
            "Código",
            "Cantidad",
            "Multiplicador",
            "Valor unitario",
            "Valor total",
          ]],
          body: selectedEmployee.breakdown.map((line) => [
            line.label,
            line.short,
            formatNumber(line.quantity),
            `${line.mode === "full" ? "x" : "+"}${line.multiplier.toFixed(2)}`,
            formatCurrency(line.unitValue),
            formatCurrency(line.totalValue),
          ]),
          headStyles: {
            fillColor: BRAND_RGB,
          },
          styles: {
            fontSize: 9,
          },
        });
      }

      doc.save(`${buildExportBaseName(fileName)}-kaiko.pdf`);
      showNotice("La exportación en PDF fue generada correctamente.", "success");
    });
  }

  if (!session.isAuthenticated) {
    return (
      <div className="auth-shell">
        <section className="auth-card">
          <div className="auth-brand">
            <img
              className="brand-mark auth-mark"
              src="/branding/logoIOS.png"
              alt={`Logo ${BRAND_NAME}`}
            />
            <p className="eyebrow">Acceso interno</p>
            <h1>{BRAND_NAME}</h1>
            <p className="auth-copy">
              Ingresa con tus credenciales internas para acceder al módulo de horas
              extras y recargos.
            </p>
            <div className="hero-tags">
              <span>Módulo protegido</span>
              <span>Horas extras Colombia</span>
              <span>Desarrollado por Zivra Studio</span>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleLocalLogin}>
            <label className="auth-field">
              <span className="auth-field-label">Usuario</span>
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) => {
                  setLoginError("");
                  setLoginForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }));
                }}
                placeholder="Correo electrónico"
                autoComplete="username"
              />
            </label>
            <label className="auth-field">
              <span className="auth-field-label">Contraseña</span>
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => {
                  setLoginError("");
                  setLoginForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }));
                }}
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
              />
            </label>
            {loginError ? <p className="inline-error">{loginError}</p> : null}
            <button className="button primary auth-submit" type="submit">
              Ingresar a {BRAND_NAME}
            </button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="hero-card">
        <div className="hero-copy">
          <div className="brand-row">
            <img className="brand-mark" src="/branding/logoIOS.png" alt={`Logo ${BRAND_NAME}`} />
            <div>
              <p className="eyebrow">Software de horas extras para Colombia</p>
              <h1>{BRAND_NAME}</h1>
            </div>
          </div>

          <p className="hero-text">
            Plataforma contable enfocada en horas extras y recargos, con importación
            de Excel, cálculo operativo, consolidado por persona y salida directa a
            PDF o Excel.
          </p>

          <div className="hero-tags">
            <span>Base en Excel</span>
            <span>Control interno</span>
            <span>Exportación directa</span>
            <span>Desarrollado por Zivra Studio</span>
            <button className="button ghost button-inline" onClick={handleLocalLogout}>
              Cerrar sesión
            </button>
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat-card accent">
            <span className="stat-label">Personas procesadas</span>
            <strong>{formatNumber(summary.totalEmployees, 0)}</strong>
            <small>{fileName}</small>
          </div>
          <div className="stat-card">
            <span className="stat-label">Horas extra</span>
            <strong>{formatNumber(summary.totalOvertimeHours)}</strong>
            <small>Conceptos extraordinarios liquidados</small>
          </div>
          <div className="stat-card">
            <span className="stat-label">Recargos</span>
            <strong>{formatNumber(summary.totalSurchargeHours)}</strong>
            <small>Nocturnos, dominicales y festivos</small>
          </div>
          <div className="stat-card">
            <span className="stat-label">Valor estimado</span>
            <strong>{formatCurrency(summary.totalValue)}</strong>
            <small>Proyección local del período</small>
          </div>
        </div>
      </header>

      {notice ? (
        <section className={`status-banner ${notice.type}`}>
          <strong>{notice.message}</strong>
        </section>
      ) : null}

      <main className="dashboard-grid">
        <section className="panel panel-import">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">1. Base operativa</p>
              <h2>Importador inteligente de Excel</h2>
            </div>
            <div className="panel-actions">
              <label className="button primary">
                Importar archivo
                <input
                  className="hidden-input"
                  type="file"
                  accept=".xlsx"
                  onChange={handleImportFile}
                />
              </label>
              <button className="button ghost" onClick={handleLoadDemo}>
                Cargar demo
              </button>
              <button className="button ghost" onClick={handleClearImport}>
                Limpiar
              </button>
            </div>
          </div>

          <div className="import-grid">
            <article className="surface-card">
              <h3>Estado del archivo</h3>
              <dl className="definition-grid">
                <div>
                  <dt>Archivo activo</dt>
                  <dd>{fileName}</dd>
                </div>
                <div>
                  <dt>Filas</dt>
                  <dd>{formatNumber(rows.length, 0)}</dd>
                </div>
                <div>
                  <dt>Columnas detectadas</dt>
                  <dd>{formatNumber(headers.length, 0)}</dd>
                </div>
                <div>
                  <dt>Procesando</dt>
                  <dd>{isPending ? "Sí" : "No"}</dd>
                </div>
              </dl>
              {importError ? <p className="inline-error">{importError}</p> : null}
              <p className="muted">
                Recomendación: incluye al menos nombre, documento y columnas como
                HED, HEN, RN, DF, HEDF o HENDF. Si tu base está en formato `.xls`,
                expórtala primero a `.xlsx`.
              </p>
            </article>

            <article className="surface-card">
              <h3>Parámetros base</h3>
              <div className="form-grid compact">
                <label>
                  Fecha por defecto
                  <input
                    type="date"
                    value={settings.periodDate}
                    onChange={(event) => updateSettings("periodDate", event.target.value)}
                  />
                </label>
                <label>
                  Días laborales por semana
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={settings.workingDaysPerWeek}
                    onChange={(event) =>
                      updateSettings("workingDaysPerWeek", Number(event.target.value) || 6)
                    }
                  />
                </label>
                <label>
                  Horas máximas semanales
                  <input type="text" value={`${getWeeklyHours(contextDate)} h`} readOnly />
                </label>
                <label>
                  Inicio de jornada nocturna
                  <input
                    type="text"
                    value={`${getNightShiftStartHour(contextDate)}:00`}
                    readOnly
                  />
                </label>
              </div>
            </article>
          </div>

          <div className="mapping-grid">
            {FIELD_DEFINITIONS.map((field) => (
              <label key={field.key} className="mapping-item">
                <span>
                  {field.label}
                  {field.required ? <strong className="required-dot"> *</strong> : null}
                </span>
                <select
                  value={mapping[field.key] || ""}
                  onChange={(event) =>
                    setMapping((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                >
                  <option value="">No asignado</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  {headers.slice(0, 8).map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 4).map((row, index) => (
                  <tr key={`preview-${index}`}>
                    {headers.slice(0, 8).map((header) => (
                      <td key={`${header}-${index}`}>{String(row[header] ?? "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel panel-list">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">2. Personas</p>
              <h2>Listado procesado</h2>
            </div>
            <input
              className="search-input"
              type="search"
              placeholder="Buscar por nombre, documento o código"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="employee-list">
            {filteredEmployees.map((employee) => (
              <button
                key={employee.id}
                className={`employee-item ${employee.id === selectedEmployeeId ? "active" : ""}`}
                onClick={() => setSelectedEmployeeId(employee.id)}
              >
                <div>
                  <strong>{employee.employeeName || "Sin nombre"}</strong>
                  <span>{employee.documentNumber || "Sin documento"}</span>
                  <small>{employee.internalCode || "Sin código interno"}</small>
                </div>
                <div className="employee-item-meta">
                  <span>{formatCurrency(employee.totalValue)}</span>
                  <small>{formatNumber(employee.overtimeHours + employee.surchargeHours)} novedades</small>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="panel panel-detail">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">3. Detalle</p>
              <h2>{selectedEmployee ? selectedEmployee.employeeName : "Selecciona una persona"}</h2>
            </div>
            {selectedEmployee ? (
              <div className="chip-group">
                <span>{selectedEmployee.documentNumber}</span>
                <span>{selectedEmployee.periodDate}</span>
                <span>{selectedEmployee.nightShiftStartHour}:00 noche</span>
              </div>
            ) : null}
          </div>

          {selectedEmployee ? (
            <>
              <div className="detail-hero">
                <article className="surface-card">
                  <h3>Base de cálculo</h3>
                  <dl className="definition-grid">
                    <div>
                      <dt>Salario base</dt>
                      <dd>{formatCurrency(selectedEmployee.baseSalary)}</dd>
                    </div>
                    <div>
                      <dt>Valor hora</dt>
                      <dd>{formatCurrency(selectedEmployee.hourlyRate)}</dd>
                    </div>
                    <div>
                      <dt>Horas mes</dt>
                      <dd>{formatNumber(selectedEmployee.monthlyHours)}</dd>
                    </div>
                    <div>
                      <dt>Código interno</dt>
                      <dd>{selectedEmployee.internalCode || "Pendiente"}</dd>
                    </div>
                  </dl>
                </article>

                <article className="surface-card">
                  <h3>Resumen de la persona</h3>
                  <dl className="definition-grid">
                    <div>
                      <dt>Horas extra</dt>
                      <dd>{formatNumber(selectedEmployee.overtimeHours)}</dd>
                    </div>
                    <div>
                      <dt>Recargos</dt>
                      <dd>{formatNumber(selectedEmployee.surchargeHours)}</dd>
                    </div>
                    <div>
                      <dt>Dominical o festivo</dt>
                      <dd>{(selectedEmployee.sundayRate * 100).toFixed(0)}%</dd>
                    </div>
                    <div>
                      <dt>Total calculado</dt>
                      <dd>{formatCurrency(selectedEmployee.totalValue)}</dd>
                    </div>
                  </dl>
                </article>
              </div>

              <div className="table-shell">
                <table>
                  <thead>
                    <tr>
                      <th>Concepto</th>
                      <th>Cantidad</th>
                      <th>Multiplicador</th>
                      <th>Valor unitario</th>
                      <th>Valor total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEmployee.breakdown.map((line) => (
                      <tr key={line.key}>
                        <td>
                          <strong>{line.label}</strong>
                          <small>{line.short}</small>
                        </td>
                        <td>{formatNumber(line.quantity)}</td>
                        <td>
                          {line.mode === "full" ? "x" : "+"}
                          {line.multiplier.toFixed(2)}
                        </td>
                        <td>{formatCurrency(line.unitValue)}</td>
                        <td>{formatCurrency(line.totalValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>No hay personas para mostrar todavía.</p>
            </div>
          )}
        </section>

        <section className="panel panel-ops">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">4. Control</p>
              <h2>Alertas y consolidado</h2>
            </div>
          </div>

          <div className="ops-grid">
            <article className="surface-card">
              <h3>Alertas automáticas</h3>
              <ul className="log-list">
                {alerts.map((alert, index) => (
                  <li key={`alert-${index}`} className={`log-item ${alert.type}`}>
                    <strong>{alert.title}</strong>
                    <span>{alert.detail}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="surface-card">
              <h3>Consolidado por concepto</h3>
              <div className="table-shell mini-table">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Concepto</th>
                      <th>Cantidad</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conceptSummary.map((item) => (
                      <tr key={item.key}>
                        <td>{item.short}</td>
                        <td>{item.label}</td>
                        <td>{formatNumber(item.quantity)}</td>
                        <td>{formatCurrency(item.totalValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        </section>

        <section className="panel panel-export">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">5. Exportación</p>
              <h2>Salida de datos en PDF o Excel</h2>
            </div>
            <div className="panel-actions">
              <button className="button ghost" onClick={handleExportPdf}>
                Exportar PDF
              </button>
              <button className="button primary" onClick={handleExportExcel}>
                Exportar Excel
              </button>
            </div>
          </div>

          <div className="payload-grid">
            <article className="surface-card">
              <h3>Resumen de cierre</h3>
              <ul className="mini-list">
                <li>Personas liquidadas: {formatNumber(summary.totalEmployees, 0)}</li>
                <li>Horas extra acumuladas: {formatNumber(summary.totalOvertimeHours)}</li>
                <li>Recargos acumulados: {formatNumber(summary.totalSurchargeHours)}</li>
                <li>Valor total del período: {formatCurrency(summary.totalValue)}</li>
              </ul>
            </article>

            <article className="surface-card">
              <h3>Contenido de la exportación</h3>
              <ul className="mini-list">
                <li>Resumen general del período y archivo base cargado.</li>
                <li>Listado de personas procesadas con sus totales.</li>
                <li>Consolidado por concepto de hora extra y recargo.</li>
                <li>Detalle individual de la persona seleccionada, si aplica.</li>
              </ul>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
