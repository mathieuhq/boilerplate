import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Eye, X } from "lucide-react";

import { DataTable } from "@/components/features/data-table/data-table";
import type {
  DataTableColumn,
  DataTableFilter,
} from "@/components/features/data-table/data-table.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import type {
  AdminOrganizationDetailsDTO,
  AdminOrganizationListDTO,
  AdminOrganizationListItemDTO,
} from "@/features/admin/application/dto/admin-organization-list-item.dto";
import type { AdminListOrganizationsInput } from "@/features/admin/domain/repositories/admin.repository.interface";
import { useTranslations } from "@/i18n";
import { formatDate } from "@/lib/utils";

type AdminOrganizationsTableProps = {
  query: AdminListOrganizationsInput;
  organizations: AdminOrganizationListDTO | null;
  organization: AdminOrganizationDetailsDTO | null;
};

export const AdminOrganizationsTable = ({
  query,
  organization,
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
        cell: (organizationItem) => (
          <div className="flex flex-wrap gap-1.5">
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
      {
        id: "actions",
        header: t("organizations.table.actions"),
        hideable: false,
        align: "right",
        cell: (organizationItem) => (
          <Button asChild size="icon-sm" variant="ghost">
            <Link
              from="/admin/organizations"
              to="/admin/organizations"
              resetScroll={false}
              search={(previous) => ({
                ...previous,
                organizationId: organizationItem.id,
              })}
              aria-label={t("organizations.actions.view")}
              title={t("organizations.actions.view")}
            >
              <Eye className="size-4" />
            </Link>
          </Button>
        ),
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
    <div className="space-y-4">
      <DataTable
        id="admin-organizations"
        query={query}
        columns={columns}
        filters={filters}
        result={organizations}
        defaultSort="createdAt.desc"
        getRowId={(organizationItem) => organizationItem.id}
        emptyMessage={t("organizations.empty")}
        exportHref="/api/admin/organizations/export"
        searchPlaceholder={t("organizations.filters.search")}
      />
      {organization && <AdminOrganizationDetails organization={organization} />}
    </div>
  );
};

const AdminOrganizationDetails = ({
  organization,
}: {
  organization: AdminOrganizationDetailsDTO;
}) => {
  const t = useTranslations("admin");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{organization.name}</CardTitle>
        <CardDescription>{organization.slug}</CardDescription>
        <CardAction>
          <Button asChild size="icon-sm" variant="ghost">
            <Link
              from="/admin/organizations"
              to="/admin/organizations"
              resetScroll={false}
              search={(previous) => ({
                ...previous,
                organizationId: undefined,
              })}
              aria-label={t("organizations.actions.close")}
              title={t("organizations.actions.close")}
            >
              <X className="size-4" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-3">
          <h4 className="text-sm font-medium">
            {t("organizations.details.members")}
          </h4>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableBody>
                {organization.members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {member.user.name}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {member.user.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <Badge variant="outline">{member.role}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-medium">
            {t("organizations.details.invitations")}
          </h4>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableBody>
                {organization.invitations.length > 0 ? (
                  organization.invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {invitation.email}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            {invitation.status}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <Badge variant="outline">{invitation.role}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="h-24 px-4 text-center text-muted-foreground">
                      {t("organizations.details.noInvitations")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
