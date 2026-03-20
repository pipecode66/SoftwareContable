import type { ReactNode } from "react";
import Link from "next/link";
import { cn, formatCurrency, formatNumber } from "@/src/lib/utils";

type HeaderAction = {
  href?: string;
  label: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions = [],
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: HeaderAction[];
}) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      <div className="header-actions">
        {actions.map((action) =>
          action.href ? (
            <Link key={action.label} href={action.href} className="ghost-link">
              {action.label}
            </Link>
          ) : null,
        )}
      </div>
    </header>
  );
}

export function Card({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("surface-card", className)}>
      {title || description ? (
        <div className="surface-head">
          <div>
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function MetricGrid({
  items,
}: {
  items: { label: string; value: string; detail?: string; tone?: string }[];
}) {
  return (
    <div className="metric-grid">
      {items.map((item) => (
        <article key={item.label} className={cn("metric-card", item.tone)}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          {item.detail ? <small>{item.detail}</small> : null}
        </article>
      ))}
    </div>
  );
}

export function BarChart({
  title,
  subtitle,
  data,
  mode = "number",
}: {
  title: string;
  subtitle: string;
  data: { id: string; label: string; value: number }[];
  mode?: "number" | "currency";
}) {
  const max = Math.max(...data.map((item) => Number(item.value || 0)), 1);

  return (
    <Card title={title} description={subtitle}>
      <div className="chart-list">
        {data.length ? (
          data.slice(0, 10).map((item) => (
            <div key={item.id} className="chart-row">
              <span>{item.label}</span>
              <div className="chart-track">
                <div
                  className="chart-bar"
                  style={{ width: `${Math.max(8, (Number(item.value) / max) * 100)}%` }}
                />
              </div>
              <strong>{mode === "currency" ? formatCurrency(item.value) : formatNumber(item.value)}</strong>
            </div>
          ))
        ) : (
          <EmptyState
            title="Sin datos todavía"
            description="Aún no hay movimientos suficientes para construir esta visualización."
          />
        )}
      </div>
    </Card>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="table-shell">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState
                  title="No hay registros"
                  description="Este módulo todavía no tiene información cargada."
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "accent";
}) {
  return <span className={cn("badge", `badge-${tone}`)}>{children}</span>;
}

export function SectionGrid({ children }: { children: ReactNode }) {
  return <div className="section-grid">{children}</div>;
}
