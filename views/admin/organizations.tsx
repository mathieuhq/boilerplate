import { AdminOrganizationsTable } from "@/components/features/dashboard/admin/admin-organizations-table";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type {
  AdminOrganizationDetailsDTO,
  AdminOrganizationListDTO,
} from "@/features/admin/application/dto/admin-organization-list-item.dto";
import type { AdminListOrganizationsInput } from "@/features/admin/domain/repositories/admin.repository.interface";
import { useTranslations } from "@/i18n";

type AdminOrganizationsViewProps = {
  query: AdminListOrganizationsInput;
  organizations: AdminOrganizationListDTO | null;
  organization: AdminOrganizationDetailsDTO | null;
};

export const AdminOrganizationsView = ({
  query,
  organization,
  organizations,
}: AdminOrganizationsViewProps) => {
  const t = useTranslations("admin");

  return (
    <PageLayout
      className="max-w-full"
      title={t("organizations.title")}
      desc={t("organizations.description")}
    >
      <AdminOrganizationsTable
        query={query}
        organization={organization}
        organizations={organizations}
      />
    </PageLayout>
  );
};
