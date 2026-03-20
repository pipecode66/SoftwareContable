import { requireCompanyContext } from "@/src/server/auth/context";
import { listCompanyRows } from "@/src/server/payroll/repository";
import { Card, DataTable, PageHeader } from "@/src/components/payroll/ui";

export default async function AuditPage() {
  const context = await requireCompanyContext();
  const logs = await listCompanyRows("payroll_audit_logs", context.activeCompanyId!, "created_at");

  return (
    <div className="surface-stack">
      <PageHeader eyebrow="Auditoría" title="Historial y trazabilidad" description="Cada cambio crítico sobre configuración, catálogos y operación queda registrado por empresa y usuario." />
      <Card title="Eventos de auditoría" description="Incluye creación, edición, eliminación lógica, clonación demo y simulaciones.">
        <DataTable
          columns={["Fecha", "Módulo", "Acción", "Registro", "Razón"]}
          rows={logs.map((item) => [
            new Date(item.created_at).toLocaleString("es-CO"),
            item.module,
            item.action,
            item.record_id || "-",
            item.reason || "-",
          ])}
        />
      </Card>
    </div>
  );
}
