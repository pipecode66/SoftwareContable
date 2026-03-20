import { query } from "./lib/db.js";

export default async function handler(req, res) {
  if (req.method === "POST") {
    // Create or update session
    const { email, settings } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email es requerido" });
    }

    try {
      const result = await query(
        `INSERT INTO sessions (email, settings, last_login)
         VALUES ($1, $2, NOW())
         ON CONFLICT (email) 
         DO UPDATE SET settings = $2, last_login = NOW()
         RETURNING *`,
        [email, JSON.stringify(settings || {})]
      );

      return res.status(200).json({
        success: true,
        session: result.rows[0],
      });
    } catch (error) {
      console.error("Session save error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "GET") {
    // Get session by email
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "Email es requerido" });
    }

    try {
      const result = await query(
        "SELECT * FROM sessions WHERE email = $1",
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Sesión no encontrada" });
      }

      return res.status(200).json({
        success: true,
        session: result.rows[0],
      });
    } catch (error) {
      console.error("Session fetch error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Método no permitido" });
}
