import { useDeferredValue, useEffect, useState, useTransition } from "react";
import readXlsxFile from "read-excel-file/browser";
import "./App.css";
import {
  DEFAULT_SETTINGS,
  FIELD_DEFINITIONS,
  LEGAL_TIMELINE,
  SOURCE_LINKS,
  buildAleluyaPayload,
  buildConceptCatalog,
  buildEmployees,
  buildPayloadFormData,
  detectColumnMap,
  flattenAleluyaConcepts,
  formatCurrency,
  formatNumber,
  getNightShiftStartHour,
  getSundayRate,
  getWeeklyHours,
  normalizeText,
  summarizeEmployees,
  SAMPLE_ROWS,
} from "./lib/overtime";

const STORAGE_KEYS = {
  session: "sandeq.session",
  connector: "sandeq.connector",
  settings: "sandeq.settings",
};

const APP_CREDENTIALS = {
  email: "admin@sandeli.com",
  password: "sandeli12@",
};

const DEFAULT_CONNECTOR = {
  baseUrl: "https://api.aleluya.com",
  email: "",
  secret: "",
  bearerToken: "",
  companyId: "",
  periodId: "",
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

function getArrayFromPayload(payload, pathCandidates) {
  for (const path of pathCandidates) {
    const value = path.split(".").reduce((current, key) => current?.[key], payload);
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function getApiErrorMessage(payload, fallback) {
  if (Array.isArray(payload?.error) && payload.error[0]?.message) {
    return payload.error[0].message;
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  return fallback;
}

function buildBasicAuth(email, secret) {
  return window.btoa(unescape(encodeURIComponent(`${email}:${secret}`)));
}

function App() {
  const [session, setSession] = useState(() =>
    loadStorage(STORAGE_KEYS.session, {
      isAuthenticated: false,
      email: "",
    }),
  );
  const [connector, setConnector] = useState(() =>
    loadStorage(STORAGE_KEYS.connector, DEFAULT_CONNECTOR),
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
  const [busyAction, setBusyAction] = useState("");
  const [logs, setLogs] = useState([
    {
      type: "info",
      message:
        "Base demo cargada. Puedes importar Excel o conectar Aleluya para operar con datos reales.",
    },
  ]);
  const [companies, setCompanies] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [aleluyaConcepts, setAleluyaConcepts] = useState([]);
  const [existingItemsByPayroll, setExistingItemsByPayroll] = useState({});
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    saveStorage(STORAGE_KEYS.session, session);
  }, [session]);

  useEffect(() => {
    saveStorage(STORAGE_KEYS.connector, connector);
  }, [connector]);

  useEffect(() => {
    saveStorage(STORAGE_KEYS.settings, settings);
  }, [settings]);

  useEffect(() => {
    startTransition(() => {
      const nextEmployees = buildEmployees(rows, mapping, settings, payrolls);
      setEmployees(nextEmployees);

      if (!nextEmployees.some((employee) => employee.id === selectedEmployeeId)) {
        setSelectedEmployeeId(nextEmployees[0]?.id || "");
      }
    });
  }, [mapping, payrolls, rows, selectedEmployeeId, settings, startTransition]);

  const headers = Object.keys(rows[0] || {});
  const selectedEmployee =
    employees.find((employee) => employee.id === selectedEmployeeId) || null;

  const filteredEmployees = employees.filter((employee) => {
    const searchValue = normalizeText(deferredSearch);

    if (!searchValue) {
      return true;
    }

    return (
      normalizeText(employee.employeeName).includes(searchValue) ||
      normalizeText(employee.documentNumber).includes(searchValue)
    );
  });

  const summary = summarizeEmployees(employees);
  const contextDate =
    selectedEmployee?.periodDate || settings.periodDate || DEFAULT_SETTINGS.periodDate;
  const legalCatalog = buildConceptCatalog(contextDate);
  const payloadPreview =
    selectedEmployee && aleluyaConcepts.length > 0
      ? buildAleluyaPayload(
          selectedEmployee,
          aleluyaConcepts,
          existingItemsByPayroll[selectedEmployee.resolvedPayrollId] || [],
        )
      : { items: [], unresolved: selectedEmployee?.breakdown?.map((line) => line.label) || [] };

  function pushLog(message, type = "info") {
    setLogs((currentLogs) => [{ message, type }, ...currentLogs].slice(0, 8));
  }

  function updateConnector(field, value) {
    setConnector((current) => ({ ...current, [field]: value }));
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
    setConnector((current) => ({
      ...current,
      bearerToken: "",
    }));
  }

  async function aleluyaRequest(path, options = {}) {
    const response = await fetch(`${connector.baseUrl}${path}`, options);
    const raw = await response.text();
    let payload = null;

    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      payload = raw;
    }

    if (!response.ok) {
      throw new Error(getApiErrorMessage(payload, `${response.status} ${response.statusText}`));
    }

    return payload;
  }

  async function runAction(label, task) {
    setBusyAction(label);

    try {
      await task();
    } catch (error) {
      const message = error.message || `No fue posible completar ${label}.`;

      if (label === "importar Excel") {
        setImportError(message);
      }

      pushLog(message, "error");
    } finally {
      setBusyAction("");
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

  function handleClearImport() {
    startTransition(() => {
      setRows([]);
      setMapping({});
      setSelectedEmployeeId("");
    });

    setFileName("sin-archivo");
    pushLog("La base cargada fue limpiada. Puedes importar un nuevo Excel.", "info");
  }

  async function handleLogin() {
    await runAction("crear sesion", async () => {
      if (!connector.email || !connector.secret) {
        throw new Error("Ingresa correo y API token o password para crear la sesion.");
      }

      const payload = await aleluyaRequest("/v1/sessions", {
        method: "POST",
        headers: {
          Authorization: `Basic ${buildBasicAuth(connector.email, connector.secret)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: connector.email,
          password: connector.secret,
        }),
      });

      const nextToken = payload?.data?.token || "";

      if (!nextToken) {
        throw new Error("Aleluya no devolvio un bearer token utilizable.");
      }

      updateConnector("bearerToken", nextToken);
      pushLog("Sesion Aleluya creada y bearer token almacenado localmente.", "success");
    });
  }

  async function handleFetchCompanies() {
    await runAction("cargar empresas", async () => {
      if (!connector.bearerToken) {
        throw new Error("Primero crea sesion o pega un bearer token valido.");
      }

      const payload = await aleluyaRequest("/v1/companies", {
        headers: {
          Authorization: `Bearer ${connector.bearerToken}`,
        },
      });

      const nextCompanies = getArrayFromPayload(payload, ["data.companies", "data"]);
      setCompanies(nextCompanies);

      if (!connector.companyId && nextCompanies[0]?.id) {
        updateConnector("companyId", nextCompanies[0].id);
      }

      pushLog(`Empresas cargadas: ${nextCompanies.length}.`, "success");
    });
  }

  async function handleFetchPeriods() {
    await runAction("cargar periodos", async () => {
      if (!connector.companyId) {
        throw new Error("Selecciona o pega un company_id antes de cargar periodos.");
      }

      const payload = await aleluyaRequest(
        `/v1/${connector.companyId}/periods?per_page=50`,
        {
          headers: {
            Authorization: `Bearer ${connector.bearerToken}`,
          },
        },
      );

      const nextPeriods = getArrayFromPayload(payload, ["data"]);
      setPeriods(nextPeriods);

      if (!connector.periodId && nextPeriods[0]?.id) {
        updateConnector("periodId", nextPeriods[0].id);
      }

      pushLog(`Periodos cargados: ${nextPeriods.length}.`, "success");
    });
  }

  async function handleFetchPayrolls() {
    await runAction("cargar nominas", async () => {
      if (!connector.companyId) {
        throw new Error("Define company_id antes de consultar nominas.");
      }

      const payload = await aleluyaRequest(
        `/v1/${connector.companyId}/payrolls?per_page=100&page=1`,
        {
          headers: {
            Authorization: `Bearer ${connector.bearerToken}`,
          },
        },
      );

      const nextPayrolls = getArrayFromPayload(payload, ["data.payrolls", "data"]);
      setPayrolls(nextPayrolls);
      pushLog(`Nominas cargadas: ${nextPayrolls.length}. Se actualizo el auto-match con el Excel.`, "success");
    });
  }

  async function handleFetchConcepts() {
    await runAction("cargar conceptos", async () => {
      if (!connector.companyId || !connector.periodId) {
        throw new Error("Necesitas company_id y period_id para consultar conceptos overtime.");
      }

      const payload = await aleluyaRequest(
        `/v1/${connector.companyId}/payroll_concepts?category=overtime&period_id=${connector.periodId}`,
        {
          headers: {
            Authorization: `Bearer ${connector.bearerToken}`,
          },
        },
      );

      const nextConcepts = flattenAleluyaConcepts(payload);
      setAleluyaConcepts(nextConcepts);
      pushLog(`Conceptos overtime cargados: ${nextConcepts.length}.`, "success");
    });
  }

  async function handleFetchExistingItems() {
    await runAction("consultar overtime actual", async () => {
      if (!selectedEmployee?.resolvedPayrollId) {
        throw new Error("La persona seleccionada no tiene payroll_id resuelto.");
      }

      const payload = await aleluyaRequest(
        `/v1/${connector.companyId}/payrolls/${selectedEmployee.resolvedPayrollId}/overtime_items?category=overtime`,
        {
          headers: {
            Authorization: `Bearer ${connector.bearerToken}`,
          },
        },
      );

      const existingItems = getArrayFromPayload(payload, ["data"]);
      setExistingItemsByPayroll((current) => ({
        ...current,
        [selectedEmployee.resolvedPayrollId]: existingItems,
      }));

      pushLog(
        `Items overtime consultados para ${selectedEmployee.employeeName}: ${existingItems.length}.`,
        "success",
      );
    });
  }

  async function handleSyncSelected() {
    await runAction("sincronizar persona", async () => {
      if (!selectedEmployee) {
        throw new Error("Selecciona una persona antes de sincronizar.");
      }

      if (!selectedEmployee.resolvedPayrollId) {
        throw new Error("La persona no tiene payroll_id resuelto para Aleluya.");
      }

      if (!aleluyaConcepts.length) {
        throw new Error("Carga primero los conceptos overtime desde Aleluya.");
      }

      const payload = buildAleluyaPayload(
        selectedEmployee,
        aleluyaConcepts,
        existingItemsByPayroll[selectedEmployee.resolvedPayrollId] || [],
      );

      if (!payload.items.length) {
        throw new Error("No hay items sincronizables. Revisa el mapeo o los conceptos Aleluya.");
      }

      const formData = buildPayloadFormData(payload.items);
      const response = await aleluyaRequest(
        `/v1/${connector.companyId}/payrolls/${selectedEmployee.resolvedPayrollId}/overtime_items`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${connector.bearerToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        },
      );

      setLastSyncResult(response);
      pushLog(
        `Sincronizacion enviada para ${selectedEmployee.employeeName} con ${payload.items.length} items.`,
        "success",
      );

      if (payload.unresolved.length) {
        pushLog(
          `Quedaron lineas sin match automatico: ${payload.unresolved.join(", ")}.`,
          "warning",
        );
      }
    });
  }

  async function handleCopyPayload() {
    const payloadBody = {
      payroll_id: selectedEmployee?.resolvedPayrollId || "",
      items: payloadPreview.items,
      unresolved: payloadPreview.unresolved,
    };

    if (!navigator.clipboard) {
      pushLog("Este navegador no permite copiar automaticamente el payload.", "warning");
      return;
    }

    await navigator.clipboard.writeText(JSON.stringify(payloadBody, null, 2));
    pushLog("Payload copiado al portapapeles.", "success");
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
                onChange={(event) =>
                  {
                    setLoginError("");
                    setLoginForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }));
                  }
                }
                placeholder="admin@sandeli.com"
                autoComplete="username"
              />
            </label>
            <label>
              Contrasena
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  {
                    setLoginError("");
                    setLoginForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }));
                  }
                }
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
            de Excel, tablero operativo, reglas laborales colombianas y puente listo
            para sincronizar con la API de Aleluya.
          </p>

          <div className="hero-tags">
            <span>Excel-first</span>
            <span>Aleluya-ready</span>
            <span>Colombia 2025-2027</span>
            <span>Desarrollado por Zivra Studio</span>
            <button className="button ghost button-inline" onClick={handleLocalLogout}>
              Cerrar sesion
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
            <small>Solo lineas de overtime</small>
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
              placeholder="Buscar por nombre o documento"
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
                      <dt>Payroll Aleluya</dt>
                      <dd>{selectedEmployee.resolvedPayrollId || "Pendiente"}</dd>
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

        <section className="panel panel-api">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">5. Integracion</p>
              <h2>Aleluya connector</h2>
            </div>
            <span className="secure-note">El token se guarda solo en este navegador.</span>
          </div>

          <div className="form-grid">
            <label>
              Base URL
              <input
                type="url"
                value={connector.baseUrl}
                onChange={(event) => updateConnector("baseUrl", event.target.value)}
              />
            </label>
            <label>
              Correo
              <input
                type="email"
                value={connector.email}
                onChange={(event) => updateConnector("email", event.target.value)}
              />
            </label>
            <label>
              API token o password
              <input
                type="password"
                value={connector.secret}
                onChange={(event) => updateConnector("secret", event.target.value)}
              />
            </label>
            <label>
              Bearer token
              <input
                type="text"
                value={connector.bearerToken}
                onChange={(event) => updateConnector("bearerToken", event.target.value)}
              />
            </label>
            <label>
              company_id
              <input
                type="text"
                value={connector.companyId}
                onChange={(event) => updateConnector("companyId", event.target.value)}
              />
            </label>
            <label>
              period_id
              <input
                type="text"
                value={connector.periodId}
                onChange={(event) => updateConnector("periodId", event.target.value)}
              />
            </label>
          </div>

          <div className="button-row">
            <button className="button primary" onClick={handleLogin}>
              {busyAction === "crear sesion" ? "Conectando..." : "Crear sesion"}
            </button>
            <button className="button ghost" onClick={handleFetchCompanies}>
              Cargar empresas
            </button>
            <button className="button ghost" onClick={handleFetchPeriods}>
              Cargar periodos
            </button>
            <button className="button ghost" onClick={handleFetchPayrolls}>
              Cargar nominas
            </button>
            <button className="button ghost" onClick={handleFetchConcepts}>
              Cargar conceptos overtime
            </button>
            <button className="button ghost" onClick={handleFetchExistingItems}>
              Consultar overtime actual
            </button>
            <button className="button primary" onClick={handleSyncSelected}>
              Sincronizar persona
            </button>
          </div>

          <div className="api-grid">
            <article className="surface-card">
              <h3>Contexto cargado</h3>
              <ul className="mini-list">
                <li>Empresas: {formatNumber(companies.length, 0)}</li>
                <li>Periodos: {formatNumber(periods.length, 0)}</li>
                <li>Nominas: {formatNumber(payrolls.length, 0)}</li>
                <li>Conceptos overtime: {formatNumber(aleluyaConcepts.length, 0)}</li>
              </ul>
            </article>

            <article className="surface-card">
              <h3>Logs recientes</h3>
              <ul className="log-list">
                {logs.map((log, index) => (
                  <li key={`log-${index}`} className={`log-item ${log.type}`}>
                    {log.message}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="panel panel-payload">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">6. Salida</p>
              <h2>Payload de sincronizacion</h2>
            </div>
            <div className="panel-actions">
              <button className="button ghost" onClick={handleCopyPayload}>
                Copiar JSON
              </button>
            </div>
          </div>

          <div className="payload-grid">
            <article className="surface-card">
              <h3>Match con conceptos Aleluya</h3>
              {selectedEmployee ? (
                <>
                  <ul className="mini-list">
                    {selectedEmployee.breakdown.map((line) => {
                      const matched = aleluyaConcepts.find((concept) =>
                        line.aleluyaCodes.includes(normalizeText(concept.coded_name)),
                      );

                      return (
                        <li key={line.key}>
                          <strong>{line.short}</strong>:{" "}
                          {matched ? `${matched.name} (${matched.coded_name})` : "Sin match automatico"}
                        </li>
                      );
                    })}
                  </ul>
                  {payloadPreview.unresolved.length ? (
                    <p className="inline-warning">
                      Pendientes: {payloadPreview.unresolved.join(", ")}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="muted">Selecciona una persona para ver el match.</p>
              )}
            </article>

            <article className="surface-card">
              <h3>JSON listo para auditoria</h3>
              <pre className="payload-box">
                {JSON.stringify(
                  {
                    payroll_id: selectedEmployee?.resolvedPayrollId || "",
                    items: payloadPreview.items,
                    last_sync: lastSyncResult?.data || null,
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
      </main>
    </div>
  );
}

export default App;
