import {
  type AdminOrganizationFilters,
  AdminOrganizationsTable,
} from "@/components/features/dashboard/admin/admin-organizations-table";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type {
  AdminOrganizationDetailsDTO,
  AdminOrganizationListDTO,
} from "@/features/admin/application/dto/admin-organization-list-item.dto";
import { useTranslations } from "@/i18n";

type AdminOrganizationsViewProps = {
  filters: AdminOrganizationFilters;
  organizations: AdminOrganizationListDTO;
  organization: AdminOrganizationDetailsDTO | null;
};

export const AdminOrganizationsView = ({
  filters,
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
        filters={filters}
        organization={organization}
        organizations={organizations}
      />
    </PageLayout>
  );
};
