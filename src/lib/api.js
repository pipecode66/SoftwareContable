// API utilities for database operations

export async function checkDatabaseHealth() {
  try {
    const response = await fetch("/api/health");
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      status: "error",
      message: error.message,
    };
  }
}

export async function runMigrations() {
  try {
    const response = await fetch("/api/migrate", {
      method: "POST",
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function saveSession(email, settings) {
  try {
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, settings }),
    });
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
}

export async function getSession(email) {
  try {
    const response = await fetch(`/api/sessions?email=${encodeURIComponent(email)}`);
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
}

export async function saveEmployees(employees, sessionEmail, fileName) {
  try {
    const response = await fetch("/api/employees", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ employees, sessionEmail, fileName }),
    });
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
}

export async function getEmployees(sessionEmail, limit = 100) {
  try {
    const params = new URLSearchParams({ limit: String(limit) });
    if (sessionEmail) {
      params.append("sessionEmail", sessionEmail);
    }
    const response = await fetch(`/api/employees?${params}`);
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
}

export async function deleteEmployees(sessionEmail) {
  try {
    const response = await fetch(`/api/employees?sessionEmail=${encodeURIComponent(sessionEmail)}`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
}
