import { OrganizationActivityTable } from "@/components/features/dashboard/organization/organization-activity-table";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type { OrganizationAuditLogListDTO } from "@/features/organization/application/dto/organization-audit-log.dto";
import { useTranslations } from "@/i18n";

type OrganizationActivityViewProps = OrganizationAuditLogListDTO & {
  limit: number;
};

export function OrganizationActivityView({
  organization,
  auditLogs,
  limit,
}: OrganizationActivityViewProps) {
  const t = useTranslations("organization.activity");

  return (
    <PageLayout
      title={t("title")}
      desc={t("description", { organization: organization.name })}
    >
      <OrganizationActivityTable auditLogs={auditLogs} limit={limit} />
    </PageLayout>
  );
}
