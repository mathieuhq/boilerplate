import {
  type AdminUserFilters,
  AdminUsersTable,
} from "@/components/features/dashboard/admin/admin-users-table";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type { AdminUserListDTO } from "@/features/admin/application/dto/admin-user-list-item.dto";
import { useTranslations } from "@/i18n";

type AdminUsersViewProps = {
  filters: AdminUserFilters;
  users: AdminUserListDTO;
};

export const AdminUsersView = ({ filters, users }: AdminUsersViewProps) => {
  const t = useTranslations("admin");

  return (
    <PageLayout
      className="max-w-full"
      title={t("users.title")}
      desc={t("users.description")}
    >
      <AdminUsersTable users={users} filters={filters} />
    </PageLayout>
  );
};
