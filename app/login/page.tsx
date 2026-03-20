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
          <p className="eyebrow">KAIKO Payroll</p>
          <h1>Nómina integral configurable para Colombia</h1>
          <p className="hero-kicker">
            Extiende el sistema actual de horas extras con capas reales de seguridad social,
            prestaciones, novedades, liquidación, auditoría y multiempresa sobre Supabase.
          </p>

          <div className="login-grid">
            <article className="mini-stat">
              <span>Cuenta demo</span>
              <strong>demo@sandeli.com</strong>
            </article>
            <article className="mini-stat">
              <span>Motor heredado</span>
              <strong>Horas extras + recargos</strong>
            </article>
            <article className="mini-stat">
              <span>Persistencia</span>
              <strong>Next.js + Supabase</strong>
            </article>
            <article className="mini-stat">
              <span>Seguridad</span>
              <strong>Auth + RLS multiempresa</strong>
            </article>
          </div>
        </div>

        <div className="login-panel">
          <div>
            <p className="eyebrow">Acceso seguro</p>
            <h2>Inicia sesión</h2>
            <p className="muted-copy">
              Usa la cuenta demo para explorar la plantilla maestra o entra con otra cuenta para
              clonar la configuración o personalizarla.
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
            <Badge tone="accent">Demo sembrada por SQL</Badge>
            <Badge tone="neutral">Sin datos quemados en frontend</Badge>
          </div>
        </div>
      </section>
    </main>
  );
}
