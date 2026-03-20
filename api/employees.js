import { query } from "./lib/db.js";

export default async function handler(req, res) {
  if (req.method === "POST") {
    // Save employee data
    const { employees, sessionEmail, fileName } = req.body;

    if (!employees || !Array.isArray(employees)) {
      return res.status(400).json({ error: "Datos de empleados inválidos" });
    }

    try {
      // Start a batch insert
      const insertedIds = [];
      
      for (const emp of employees) {
        const result = await query(
          `INSERT INTO employees (
            session_email,
            file_name,
            employee_name,
            document_number,
            internal_code,
            hourly_rate,
            overtime_hours,
            surcharge_hours,
            total_value,
            raw_data,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          RETURNING id`,
          [
            sessionEmail || null,
            fileName || null,
            emp.employeeName || null,
            emp.documentNumber || null,
            emp.internalCode || null,
            emp.hourlyRate || 0,
            emp.overtimeHours || 0,
            emp.surchargeHours || 0,
            emp.totalValue || 0,
            JSON.stringify(emp),
          ]
        );
        insertedIds.push(result.rows[0].id);
      }

      return res.status(200).json({
        success: true,
        message: `${insertedIds.length} empleados guardados`,
        ids: insertedIds,
      });
    } catch (error) {
      console.error("Employee save error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "GET") {
    // Get employees, optionally filtered by session email
    const { sessionEmail, limit = 100 } = req.query;

    try {
      let result;
      if (sessionEmail) {
        result = await query(
          "SELECT * FROM employees WHERE session_email = $1 ORDER BY created_at DESC LIMIT $2",
          [sessionEmail, parseInt(limit)]
        );
      } else {
        result = await query(
          "SELECT * FROM employees ORDER BY created_at DESC LIMIT $1",
          [parseInt(limit)]
        );
      }

      return res.status(200).json({
        success: true,
        employees: result.rows,
        count: result.rows.length,
      });
    } catch (error) {
      console.error("Employee fetch error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "DELETE") {
    // Delete employees by session email
    const { sessionEmail } = req.query;

    if (!sessionEmail) {
      return res.status(400).json({ error: "sessionEmail es requerido" });
    }

    try {
      const result = await query(
        "DELETE FROM employees WHERE session_email = $1",
        [sessionEmail]
      );

      return res.status(200).json({
        success: true,
        message: `${result.rowCount} empleados eliminados`,
      });
    } catch (error) {
      console.error("Employee delete error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Método no permitido" });
}
