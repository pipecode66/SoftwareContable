-- Script de inicialización de tablas para SandeQ
-- Base de datos PostgreSQL en Supabase

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

-- Confirmar creación
SELECT 'Tablas creadas exitosamente' as status;
