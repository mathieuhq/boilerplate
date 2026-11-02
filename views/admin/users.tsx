import { AdminUsersTable } from "@/components/features/dashboard/admin/admin-users-table";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type { AdminRoleDTO } from "@/features/admin/application/dto/admin-role.dto";
import type { AdminUserListDTO } from "@/features/admin/application/dto/admin-user-list-item.dto";
import type { AdminListUsersInput } from "@/features/admin/domain/repositories/admin.repository.interface";
import { useTranslations } from "@/i18n";
import type { AccessGrants } from "@/shared/domain/access-control";

type AdminUsersViewProps = {
  query: AdminListUsersInput;
  users: AdminUserListDTO | null;
  roles: AdminRoleDTO[];
  access: AccessGrants;
};

export const AdminUsersView = ({
  query,
  users,
  roles,
  access,
}: AdminUsersViewProps) => {
  const t = useTranslations("admin");

  return (
    <PageLayout
      fill
      className="max-w-full"
      title={t("users.title")}
      desc={t("users.description")}
    >
      <AdminUsersTable
        query={query}
        users={users}
        roles={roles}
        access={access}
      />
    </PageLayout>
  );
};
