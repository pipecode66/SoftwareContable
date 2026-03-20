import { useDeferredValue, useEffect, useState, useTransition } from "react";
import readXlsxFile from "read-excel-file/browser";
import "./App.css";
import {
  DEFAULT_SETTINGS,
  FIELD_DEFINITIONS,
  LEGAL_TIMELINE,
  SOURCE_LINKS,
  buildConceptCatalog,
  buildEmployeeReport,
  buildEmployees,
  buildOperationalAlerts,
  detectColumnMap,
  formatCurrency,
  formatNumber,
  getNightShiftStartHour,
  getSundayRate,
  getWeeklyHours,
  normalizeText,
  summarizeByConcept,
  summarizeEmployees,
  SAMPLE_ROWS,
} from "./lib/overtime";
import {
  checkDatabaseHealth,
  runMigrations,
  saveSession,
  saveEmployees,
} from "./lib/api";

const STORAGE_KEYS = {
  session: "sandeq.session",
  settings: "sandeq.settings",
};

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
  const [logs, setLogs] = useState([
    {
      type: "info",
      message: "Base demo cargada. Puedes importar Excel o continuar con la base de ejemplo.",
    },
  ]);
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);
  const [dbStatus, setDbStatus] = useState({
    status: "checking",
    message: "Verificando conexion...",
  });

  useEffect(() => {
    saveStorage(STORAGE_KEYS.session, session);
  }, [session]);

  // Check database connection on mount
  useEffect(() => {
    async function initDatabase() {
      const health = await checkDatabaseHealth();
      if (health.status === "connected") {
        setDbStatus({
          status: "connected",
          message: "Base de datos conectada",
          details: health.database,
        });
        pushLog("Conexion a PostgreSQL establecida.", "success");
      } else {
        // Try to run migrations first
        const migrateResult = await runMigrations();
        if (migrateResult.success) {
          setDbStatus({
            status: "connected",
            message: "Base de datos configurada",
            tables: migrateResult.tables,
          });
          pushLog("Base de datos PostgreSQL configurada correctamente.", "success");
        } else {
          setDbStatus({
            status: "disconnected",
            message: health.message || "Sin conexion a base de datos",
          });
        }
      }
    }
    initDatabase();
  }, []);

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
  const legalCatalog = buildConceptCatalog(contextDate);
  const employeeReport = buildEmployeeReport(selectedEmployee);

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

  function pushLog(message, type = "info") {
    setLogs((currentLogs) => [{ message, type }, ...currentLogs].slice(0, 8));
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
      pushLog("Sesion local iniciada en SandeQ.", "success");
      return;
    }

    setLoginError("Credenciales invalidas. Verifica usuario y contrasena.");
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

      pushLog(message, "error");
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
        throw new Error("El archivo no tiene filas utiles para procesar.");
      }

      const detectedMapping = detectColumnMap(Object.keys(objectRows[0]));
      setImportError("");
      setFileName(file.name);

      startTransition(() => {
        setRows(objectRows);
        setMapping(detectedMapping);
      });

      pushLog(`Base importada desde ${file.name}. Se detectaron ${objectRows.length} filas.`, "success");
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
    pushLog("Se restauro la base demo con tres personas de referencia.", "info");
  }

  async function handleSaveToDatabase() {
    if (employees.length === 0) {
      pushLog("No hay empleados para guardar en la base de datos.", "warning");
      return;
    }

    if (dbStatus.status !== "connected") {
      pushLog("No hay conexion a la base de datos.", "error");
      return;
    }

    const result = await saveEmployees(employees, session.email, fileName);
    if (result.success) {
      pushLog(`${employees.length} empleados guardados en PostgreSQL.`, "success");
    } else {
      pushLog(`Error al guardar: ${result.error}`, "error");
    }
  }

  function handleClearImport() {
    startTransition(() => {
      setRows([]);
      setMapping({});
      setSelectedEmployeeId("");
    });

    setFileName("sin-archivo");
    pushLog("La base cargada fue limpiada. Puedes importar un nuevo Excel.", "info");
  }

  async function handleCopyReport() {
    if (!employeeReport) {
      pushLog("No hay una persona seleccionada para copiar el resumen.", "warning");
      return;
    }

    if (!navigator.clipboard) {
      pushLog("Este navegador no permite copiar automaticamente el resumen.", "warning");
      return;
    }

    await navigator.clipboard.writeText(JSON.stringify(employeeReport, null, 2));
    pushLog("Resumen interno copiado al portapapeles.", "success");
  }

  if (!session.isAuthenticated) {
    return (
      <div className="auth-shell">
        <section className="auth-card">
          <div className="auth-brand">
            <img className="brand-mark auth-mark" src="/branding/logoIOS.png" alt="Logo SandeQ" />
            <p className="eyebrow">Acceso interno</p>
            <h1>SandeQ</h1>
            <p className="auth-copy">
              Ingresa con tus credenciales internas para acceder al modulo de horas
              extras y recargos.
            </p>
            <div className="hero-tags">
              <span>Modulo protegido</span>
              <span>Horas extras Colombia</span>
              <span>Desarrollado por Zivra Studio</span>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleLocalLogin}>
            <label>
              Usuario
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
                placeholder="admin@sandeli.com"
                autoComplete="username"
              />
            </label>
            <label>
              Contrasena
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
                placeholder="Ingresa tu contrasena"
                autoComplete="current-password"
              />
            </label>
            {loginError ? <p className="inline-error">{loginError}</p> : null}
            <button className="button primary auth-submit" type="submit">
              Ingresar a SandeQ
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
            <img className="brand-mark" src="/branding/logoIOS.png" alt="Logo SandeQ" />
            <div>
              <p className="eyebrow">Motor de horas extras para Colombia</p>
              <h1>SandeQ</h1>
            </div>
          </div>

          <p className="hero-text">
            Software contable enfocado en horas extras y recargos, con importacion
            de Excel, tablero operativo, reglas laborales colombianas y control
            interno para revision y cierre.
          </p>

          <div className="hero-tags">
            <span>Excel-first</span>
            <span>Control interno</span>
            <span>Colombia 2025-2027</span>
            <span>Desarrollado por Zivra Studio</span>
            <button className="button ghost button-inline" onClick={handleLocalLogout}>
              Cerrar sesion
            </button>
          </div>
        </div>

        <div className="hero-stats">
          <div className={`stat-card ${dbStatus.status === "connected" ? "accent" : dbStatus.status === "checking" ? "" : "error"}`}>
            <span className="stat-label">Base de datos</span>
            <strong>{dbStatus.status === "connected" ? "Conectada" : dbStatus.status === "checking" ? "..." : "Desconectada"}</strong>
            <small>{dbStatus.message}</small>
          </div>
          <div className="stat-card accent">
            <span className="stat-label">Personas procesadas</span>
            <strong>{formatNumber(summary.totalEmployees, 0)}</strong>
            <small>{fileName}</small>
          </div>
          <div className="stat-card">
            <span className="stat-label">Horas extra</span>
            <strong>{formatNumber(summary.totalOvertimeHours)}</strong>
            <small>Solo conceptos de hora extra</small>
          </div>
          <div className="stat-card">
            <span className="stat-label">Recargos</span>
            <strong>{formatNumber(summary.totalSurchargeHours)}</strong>
            <small>Nocturnos, dominicales y festivos</small>
          </div>
          <div className="stat-card">
            <span className="stat-label">Valor estimado</span>
            <strong>{formatCurrency(summary.totalValue)}</strong>
            <small>Calculo local para preliquidacion</small>
          </div>
        </div>
      </header>

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
  {dbStatus.status === "connected" && employees.length > 0 && (
                <button className="button primary" onClick={handleSaveToDatabase}>
                  Guardar en BD
                </button>
              )}
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
                  <dd>{isPending ? "Si" : "No"}</dd>
                </div>
              </dl>
              {importError ? <p className="inline-error">{importError}</p> : null}
              <p className="muted">
                Recomendacion: incluye al menos nombre, documento y las columnas de
                cantidades como HED, HEN, RN, DF, HEDF o HENDF. Si tu base esta en
                formato .xls, exportala primero a .xlsx.
              </p>
            </article>

            <article className="surface-card">
              <h3>Parametros base</h3>
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
                  Dias laborales por semana
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
                  Horas maximas semanales
                  <input type="text" value={`${getWeeklyHours(contextDate)} h`} readOnly />
                </label>
                <label>
                  Inicio jornada nocturna
                  <input type="text" value={`${getNightShiftStartHour(contextDate)}:00`} readOnly />
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

        <section className="panel panel-rules">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">2. Regla laboral</p>
              <h2>Motor Colombia sensible a fechas</h2>
            </div>
            <div className="rate-pill">
              Dominical/festivo actual: {(getSundayRate(contextDate) * 100).toFixed(0)}%
            </div>
          </div>

          <div className="timeline-grid">
            {LEGAL_TIMELINE.map((item) => (
              <article key={item.date} className="timeline-card">
                <span>{item.date}</span>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>

          <div className="rules-table">
            {legalCatalog.map((rule) => (
              <article key={rule.key} className="rule-card">
                <div>
                  <span className="rule-code">{rule.short}</span>
                  <strong>{rule.label}</strong>
                </div>
                <div className="rule-meta">
                  <span>
                    {rule.mode === "full" ? "x" : "+"}
                    {rule.multiplier.toFixed(2)}
                  </span>
                  <p>{rule.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel panel-list">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">3. Operacion</p>
              <h2>Personas liquidadas</h2>
            </div>
            <input
              className="search-input"
              type="search"
              placeholder="Buscar por nombre, documento o codigo"
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
                  <small>{employee.internalCode || "Sin codigo interno"}</small>
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
              <p className="eyebrow">4. Detalle</p>
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
                  <h3>Base de calculo</h3>
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
                      <dt>Codigo interno</dt>
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
                      <dt>Dominical/festivo</dt>
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
              <p>No hay personas para mostrar todavia.</p>
            </div>
          )}
        </section>

        <section className="panel panel-ops">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">5. Control interno</p>
              <h2>Alertas y consolidado operativo</h2>
            </div>
          </div>

          <div className="ops-grid">
            <article className="surface-card">
              <h3>Alertas automaticas</h3>
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
                      <th>Codigo</th>
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
              <p className="eyebrow">6. Salida</p>
              <h2>Resumen interno exportable</h2>
            </div>
            <div className="panel-actions">
              <button className="button ghost" onClick={handleCopyReport}>
                Copiar JSON
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
                <li>Valor total del periodo: {formatCurrency(summary.totalValue)}</li>
              </ul>
            </article>

            <article className="surface-card">
              <h3>JSON de auditoria</h3>
              <pre className="payload-box">
                {JSON.stringify(
                  employeeReport || {
                    mensaje: "Selecciona una persona para generar el resumen interno.",
                  },
                  null,
                  2,
                )}
              </pre>
            </article>
          </div>
        </section>

        <section className="panel panel-sources">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Base documental</p>
              <h2>Fuentes usadas para el diseno</h2>
            </div>
          </div>

          <div className="sources-grid">
            {SOURCE_LINKS.map((source) => (
              <a
                key={source.href}
                className="source-card"
                href={source.href}
                target="_blank"
                rel="noreferrer"
              >
                <strong>{source.label}</strong>
                <p>{source.note}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="panel panel-notes">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">7. Bitacora</p>
              <h2>Actividad reciente</h2>
            </div>
          </div>

          <ul className="log-list">
            {logs.map((log, index) => (
              <li key={`log-${index}`} className={`log-item ${log.type}`}>
                {log.message}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

export default App;
