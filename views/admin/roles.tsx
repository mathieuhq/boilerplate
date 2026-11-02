import { AdminRolesTable } from "@/components/features/dashboard/admin/admin-roles-table";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type { AdminRoleDTO } from "@/features/admin/application/dto/admin-role.dto";
import { useTranslations } from "@/i18n";
import type { AccessGrants } from "@/shared/domain/access-control";

type AdminRolesViewProps = {
  roles: AdminRoleDTO[];
  access: AccessGrants;
};

export const AdminRolesView = ({ roles, access }: AdminRolesViewProps) => {
  const t = useTranslations("admin");

  return (
    <PageLayout
      className="max-w-full"
      title={t("roles.title")}
      desc={t("roles.description")}
    >
      <AdminRolesTable roles={roles} access={access} />
    </PageLayout>
  );
};
