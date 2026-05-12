import { useState } from "react";
import { Eye } from "lucide-react";

import { AdminPagination } from "@/components/features/dashboard/admin/admin-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  AdminOrganizationDetailsDTO,
  AdminOrganizationListDTO,
  AdminOrganizationListItemDTO,
} from "@/features/admin/application/dto/admin-organization-list-item.dto";
import { useTranslations } from "@/i18n";
import Link, { useRouter } from "@/lib/navigation";
import { formatDate } from "@/lib/utils";

type AdminOrganizationsTableProps = {
  filters: AdminOrganizationFilters;
  organizations: AdminOrganizationListDTO;
  organization: AdminOrganizationDetailsDTO | null;
};

export type AdminOrganizationFilters = {
  page: number;
  limit: number;
  search?: string;
  organizationId?: string;
};

export const AdminOrganizationsTable = ({
  filters,
  organization,
  organizations,
}: AdminOrganizationsTableProps) => {
  return (
    <div className="space-y-4">
      <AdminOrganizationsFilters filters={filters} />
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <AdminOrganizationsTableHeader />
          <TableBody>
            {organizations.items.length > 0 ? (
              organizations.items.map((organizationItem) => (
                <AdminOrganizationsTableRow
                  key={organizationItem.id}
                  filters={filters}
                  organization={organizationItem}
                />
              ))
            ) : (
              <AdminOrganizationsEmptyRow />
            )}
          </TableBody>
        </Table>
      </div>
      <AdminPagination
        search={filters}
        page={organizations.page}
        basePath="/admin/organizations"
        pageCount={organizations.pageCount}
      />
      {organization && <AdminOrganizationDetails organization={organization} />}
    </div>
  );
};

const AdminOrganizationsFilters = ({
  filters,
}: {
  filters: AdminOrganizationFilters;
}) => {
  const t = useTranslations("admin");
  const router = useRouter();
  const [search, setSearch] = useState(filters.search ?? "");

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(
          buildOrganizationsHref({
            search,
            page: 1,
            limit: filters.limit,
          }),
        );
      }}
    >
      <Input
        value={search}
        className="sm:max-w-sm"
        placeholder={t("organizations.filters.search")}
        onChange={(event) => setSearch(event.target.value)}
      />
      <Button type="submit">{t("actions.apply")}</Button>
    </form>
  );
};

const AdminOrganizationsTableHeader = () => {
  const t = useTranslations("admin");

  return (
    <TableHeader className="bg-muted/50">
      <TableRow>
        <TableHead className="px-4">{t("organizations.table.name")}</TableHead>
        <TableHead className="hidden px-4 lg:table-cell">
          {t("organizations.table.owner")}
        </TableHead>
        <TableHead className="hidden px-4 md:table-cell">
          {t("organizations.table.usage")}
        </TableHead>
        <TableHead className="hidden px-4 xl:table-cell">
          {t("organizations.table.created")}
        </TableHead>
        <TableHead className="px-4 text-right">
          {t("organizations.table.actions")}
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

const AdminOrganizationsTableRow = ({
  filters,
  organization,
}: {
  filters: AdminOrganizationFilters;
  organization: AdminOrganizationListItemDTO;
}) => {
  const t = useTranslations("admin");

  return (
    <TableRow>
      <TableCell className="px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{organization.name}</p>
          <p className="text-muted-foreground truncate text-sm">
            {organization.slug}
          </p>
        </div>
      </TableCell>
      <TableCell className="hidden px-4 py-3 lg:table-cell">
        {organization.owner ? (
          <div className="min-w-0">
            <p className="truncate">{organization.owner.name}</p>
            <p className="text-muted-foreground truncate text-sm">
              {organization.owner.email}
            </p>
          </div>
        ) : (
          <span className="text-muted-foreground">
            {t("organizations.table.noOwner")}
          </span>
        )}
      </TableCell>
      <TableCell className="hidden px-4 py-3 md:table-cell">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">
            {t("organizations.table.members", {
              count: organization.membersCount,
            })}
          </Badge>
          <Badge variant="outline">
            {t("organizations.table.invitations", {
              count: organization.pendingInvitationsCount,
            })}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground hidden px-4 py-3 text-sm xl:table-cell">
        {formatDate(organization.createdAt)}
      </TableCell>
      <TableCell className="px-4 py-3 text-right">
        <Button asChild size="icon-sm" variant="ghost">
          <Link
            href={buildOrganizationsHref({
              ...filters,
              organizationId: organization.id,
            })}
            aria-label={t("organizations.actions.view")}
            title={t("organizations.actions.view")}
          >
            <Eye className="size-4" />
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
};

const AdminOrganizationsEmptyRow = () => {
  const t = useTranslations("admin");

  return (
    <TableRow>
      <TableCell
        colSpan={5}
        className="text-muted-foreground h-24 px-4 text-center"
      >
        {t("organizations.empty")}
      </TableCell>
    </TableRow>
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
                        <p className="text-muted-foreground truncate text-sm">
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
                          <p className="text-muted-foreground truncate text-sm">
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
                    <TableCell className="text-muted-foreground h-24 px-4 text-center">
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

function buildOrganizationsHref(filters: AdminOrganizationFilters) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters) as [string, unknown][]) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }

  return `/admin/organizations?${params.toString()}`;
}
