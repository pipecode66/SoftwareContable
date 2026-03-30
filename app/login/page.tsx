import { signInAction } from "@/src/server/payroll/actions/auth";
import { Badge } from "@/src/components/payroll/ui";
import { isSupabaseConfigured } from "@/src/lib/supabase/env";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="login-hero">
          <p className="eyebrow">Software empresarial</p>
          <h1>KAIKO PAYROLL</h1>
          <p className="hero-kicker">
            Plataforma integral para administrar nómina, horas extras, recargos, novedades,
            empleados y configuración laboral para empresas en Colombia.
          </p>
        </div>

        <div className="login-panel">
          <div>
            <p className="eyebrow">Acceso seguro</p>
            <h2>Inicia sesión</h2>
            <p className="muted-copy">
              Ingresa con tu cuenta para acceder a la operación, la configuración y el control
              integral de nómina de tu empresa.
            </p>
          </div>

          {!configured ? (
            <div className="surface-card">
              <Badge tone="warning">Configuración pendiente</Badge>
              <p className="muted-copy">
                Define `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y
                `SUPABASE_SERVICE_ROLE_KEY` para habilitar autenticación y persistencia.
              </p>
            </div>
          ) : null}

          <form action={signInAction} className="login-form">
            <label>
              Correo electrónico
              <input type="email" name="email" autoComplete="username" required />
            </label>
            <label>
              Contraseña
              <input type="password" name="password" autoComplete="current-password" required />
            </label>
            {params.error ? <p className="error-inline">{decodeURIComponent(params.error)}</p> : null}
            <button type="submit" className="primary-button">
              Ingresar al sistema
            </button>
          </form>

          <div className="inline-actions">
            <Badge tone="accent">Entorno corporativo</Badge>
            <Badge tone="neutral">Gestión centralizada en Supabase</Badge>
          </div>
        </div>
      </section>
    </main>
  );
}
