import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const migrations = `
-- Tabla de sesiones de usuario
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de empleados procesados
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  session_email VARCHAR(255),
  file_name VARCHAR(500),
  employee_name VARCHAR(500),
  document_number VARCHAR(100),
  internal_code VARCHAR(100),
  hourly_rate DECIMAL(15, 2) DEFAULT 0,
  overtime_hours DECIMAL(10, 2) DEFAULT 0,
  surcharge_hours DECIMAL(10, 2) DEFAULT 0,
  total_value DECIMAL(15, 2) DEFAULT 0,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_employees_session_email ON employees(session_email);
CREATE INDEX IF NOT EXISTS idx_employees_document_number ON employees(document_number);
CREATE INDEX IF NOT EXISTS idx_employees_created_at ON employees(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_email ON sessions(email);

-- Tabla de logs de auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  session_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_session ON audit_logs(session_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
`;

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log("Conectando a la base de datos...");
    
    // Test connection
    const testResult = await client.query("SELECT NOW() as time");
    console.log("Conexión exitosa:", testResult.rows[0].time);
    
    console.log("Ejecutando migraciones...");
    await client.query(migrations);
    
    console.log("Migraciones completadas exitosamente!");
    
    // Verify tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    console.log("Tablas en la base de datos:");
    tablesResult.rows.forEach(row => {
      console.log(" -", row.table_name);
    });
    
  } catch (error) {
    console.error("Error ejecutando migraciones:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
