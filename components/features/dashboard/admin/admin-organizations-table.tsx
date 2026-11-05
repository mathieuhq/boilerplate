import { useMemo } from "react";

import { DataTable } from "@/components/features/data-table/data-table";
import type {
  DataTableColumn,
  DataTableFilter,
} from "@/components/features/data-table/data-table.types";
import { Badge } from "@/components/ui/badge";
import type {
  AdminOrganizationListDTO,
  AdminOrganizationListItemDTO,
} from "@/features/admin/application/dto/admin-organization-list-item.dto";
import type { AdminListOrganizationsInput } from "@/features/admin/domain/repositories/admin.repository.interface";
import { useTranslations } from "@/i18n";
import { formatDate } from "@/lib/utils";

type AdminOrganizationsTableProps = {
  query: AdminListOrganizationsInput;
  organizations: AdminOrganizationListDTO | null;
};

export const AdminOrganizationsTable = ({
  query,
  organizations,
}: AdminOrganizationsTableProps) => {
  const t = useTranslations("admin");

  const columns = useMemo<DataTableColumn<AdminOrganizationListItemDTO>[]>(
    () => [
      {
        id: "name",
        header: t("organizations.table.name"),
        sortable: true,
        hideable: false,
        cell: (organizationItem) => (
          <div className="max-w-72 min-w-0">
            <p className="truncate font-medium">{organizationItem.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {organizationItem.slug}
            </p>
          </div>
        ),
      },
      {
        id: "owner",
        header: t("organizations.table.owner"),
        cell: (organizationItem) =>
          organizationItem.owner ? (
            <div className="max-w-64 min-w-0">
              <p className="truncate">{organizationItem.owner.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {organizationItem.owner.email}
              </p>
            </div>
          ) : (
            <span className="text-muted-foreground">
              {t("organizations.table.noOwner")}
            </span>
          ),
      },
      {
        id: "members",
        header: t("organizations.table.usage"),
        sortable: true,
        align: "center",
        cell: (organizationItem) => (
          <div className="flex flex-wrap justify-center gap-1.5">
            <Badge variant="outline">
              {t("organizations.table.members", {
                count: organizationItem.membersCount,
              })}
            </Badge>
            <Badge variant="outline">
              {t("organizations.table.invitations", {
                count: organizationItem.pendingInvitationsCount,
              })}
            </Badge>
          </div>
        ),
      },
      {
        id: "createdAt",
        header: t("organizations.table.created"),
        sortable: true,
        cellClassName: "text-sm text-muted-foreground",
        cell: (organizationItem) => formatDate(organizationItem.createdAt),
      },
    ],
    [t],
  );

  const filters = useMemo<DataTableFilter[]>(
    () => [
      {
        type: "dateRange",
        key: "createdAt",
        label: t("organizations.filters.createdAt"),
      },
    ],
    [t],
  );

  return (
    <DataTable
      id="admin-organizations"
      query={query}
      columns={columns}
      filters={filters}
      result={organizations}
      defaultSort="createdAt.desc"
      getRowId={(organizationItem) => organizationItem.id}
      emptyMessage={t("organizations.empty")}
      exportHref="/api/v1/private/admin/organizations/export"
      searchPlaceholder={t("organizations.filters.search")}
    />
  );
};
