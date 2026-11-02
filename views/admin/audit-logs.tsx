import { AdminAuditLogsTable } from "@/components/features/dashboard/admin/admin-audit-logs-table";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type {
  AdminAuditLogFacetsDTO,
  AdminAuditLogListDTO,
} from "@/features/admin/application/dto/admin-audit-log.dto";
import type { AdminListAuditLogsInput } from "@/features/admin/domain/repositories/admin.repository.interface";
import { useTranslations } from "@/i18n";

type AdminAuditLogsViewProps = {
  query: AdminListAuditLogsInput;
  auditLogs: AdminAuditLogListDTO | null;
  facets: AdminAuditLogFacetsDTO;
};

export const AdminAuditLogsView = ({
  query,
  auditLogs,
  facets,
}: AdminAuditLogsViewProps) => {
  const t = useTranslations("admin");

  return (
    <PageLayout
      className="max-w-full"
      title={t("auditLogs.title")}
      desc={t("auditLogs.description")}
    >
      <AdminAuditLogsTable
        query={query}
        auditLogs={auditLogs}
        facets={facets}
      />
    </PageLayout>
  );
};
