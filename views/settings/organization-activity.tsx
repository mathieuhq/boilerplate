import { OrganizationActivityTable } from "@/components/features/dashboard/organization/organization-activity-table";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type { OrganizationAuditLogListDTO } from "@/features/organization/application/dto/organization-audit-log.dto";
import type { ListOrganizationAuditLogsInput } from "@/features/organization/domain/repositories/organization-audit-log.repository.interface";
import { useTranslations } from "@/i18n";

type OrganizationActivityViewProps = {
  query: ListOrganizationAuditLogsInput;
  organization: OrganizationAuditLogListDTO["organization"] | null;
  auditLogs: OrganizationAuditLogListDTO["auditLogs"] | null;
};

export function OrganizationActivityView({
  query,
  organization,
  auditLogs,
}: OrganizationActivityViewProps) {
  const t = useTranslations("organization.activity");

  return (
    <PageLayout
      title={t("title")}
      desc={
        organization
          ? t("description", { organization: organization.name })
          : t("fallbackDescription")
      }
    >
      <OrganizationActivityTable query={query} auditLogs={auditLogs} />
    </PageLayout>
  );
}
