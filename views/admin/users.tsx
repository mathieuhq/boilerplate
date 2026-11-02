import {
  type AdminUserFilters,
  AdminUsersTable,
} from "@/components/features/dashboard/admin/admin-users-table";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type { AdminRoleDTO } from "@/features/admin/application/dto/admin-role.dto";
import type { AdminUserListDTO } from "@/features/admin/application/dto/admin-user-list-item.dto";
import { useTranslations } from "@/i18n";
import type { AccessGrants } from "@/shared/domain/access-control";

type AdminUsersViewProps = {
  filters: AdminUserFilters;
  users: AdminUserListDTO;
  roles: AdminRoleDTO[];
  access: AccessGrants;
};

export const AdminUsersView = ({
  filters,
  users,
  roles,
  access,
}: AdminUsersViewProps) => {
  const t = useTranslations("admin");

  return (
    <PageLayout
      className="max-w-full"
      title={t("users.title")}
      desc={t("users.description")}
    >
      <AdminUsersTable
        users={users}
        roles={roles}
        filters={filters}
        access={access}
      />
    </PageLayout>
  );
};
