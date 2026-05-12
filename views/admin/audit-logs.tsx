import {
  type AdminAuditLogFilters,
  AdminAuditLogsTable,
} from "@/components/features/dashboard/admin/admin-audit-logs-table";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type { AdminAuditLogListDTO } from "@/features/admin/application/dto/admin-audit-log.dto";
import { useTranslations } from "@/i18n";

type AdminAuditLogsViewProps = {
  filters: AdminAuditLogFilters;
  auditLogs: AdminAuditLogListDTO;
};

export const AdminAuditLogsView = ({
  filters,
  auditLogs,
}: AdminAuditLogsViewProps) => {
  const t = useTranslations("admin");

  return (
    <PageLayout
      className="max-w-full"
      title={t("auditLogs.title")}
      desc={t("auditLogs.description")}
    >
      <AdminAuditLogsTable filters={filters} auditLogs={auditLogs} />
    </PageLayout>
  );
};
