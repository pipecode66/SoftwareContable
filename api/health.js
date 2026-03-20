import { query } from "./lib/db.js";

export default async function handler(req, res) {
  try {
    const result = await query("SELECT NOW() as current_time, version() as pg_version");
    
    res.status(200).json({
      status: "connected",
      database: {
        currentTime: result.rows[0].current_time,
        version: result.rows[0].pg_version,
      },
      message: "Conexión a PostgreSQL exitosa",
    });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({
      status: "error",
      message: "Error al conectar con la base de datos",
      error: error.message,
    });
  }
}
