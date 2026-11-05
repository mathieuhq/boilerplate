import { useMemo } from "react";

import { DataTable } from "@/components/features/data-table/data-table";
import type {
  DataTableColumn,
  DataTableFilter,
} from "@/components/features/data-table/data-table.types";
import { Badge } from "@/components/ui/badge";
import type {
  AdminAuditLogDTO,
  AdminAuditLogFacetsDTO,
  AdminAuditLogListDTO,
} from "@/features/admin/application/dto/admin-audit-log.dto";
import type { AdminListAuditLogsInput } from "@/features/admin/domain/repositories/admin.repository.interface";
import { useTranslations } from "@/i18n";
import { formatDate } from "@/lib/utils";

type AdminAuditLogsTableProps = {
  query: AdminListAuditLogsInput;
  auditLogs: AdminAuditLogListDTO | null;
  facets: AdminAuditLogFacetsDTO;
};

export const AdminAuditLogsTable = ({
  query,
  auditLogs,
  facets,
}: AdminAuditLogsTableProps) => {
  const t = useTranslations("admin");

  const columns = useMemo<DataTableColumn<AdminAuditLogDTO>[]>(
    () => [
      {
        id: "action",
        header: t("auditLogs.table.action"),
        sortable: true,
        hideable: false,
        cell: (auditLog) => (
          <div className="max-w-80 min-w-0">
            <p className="truncate font-medium">{auditLog.action}</p>
            {auditLog.organization && (
              <p className="truncate text-sm text-muted-foreground">
                {auditLog.organization.name}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "actorType",
        header: t("auditLogs.table.actor"),
        sortable: true,
        cell: (auditLog) =>
          auditLog.actorUser ? (
            <div className="max-w-64 min-w-0">
              <p className="truncate">{auditLog.actorUser.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {auditLog.actorUser.email}
              </p>
            </div>
          ) : (
            <Badge variant="outline">{auditLog.actorType}</Badge>
          ),
      },
      {
        id: "resourceType",
        header: t("auditLogs.table.resource"),
        sortable: true,
        align: "center",
        cell: (auditLog) => (
          <div className="flex flex-wrap justify-center gap-1.5">
            <Badge variant="outline">{auditLog.resourceType}</Badge>
            {auditLog.resourceId && (
              <Badge variant="outline">{auditLog.resourceId}</Badge>
            )}
          </div>
        ),
      },
      {
        id: "createdAt",
        header: t("auditLogs.table.date"),
        sortable: true,
        cellClassName: "text-sm text-muted-foreground",
        cell: (auditLog) => formatDate(auditLog.createdAt),
      },
    ],
    [t],
  );

  const filters = useMemo<DataTableFilter[]>(
    () => [
      {
        type: "multiSelect",
        key: "action",
        label: t("auditLogs.filters.action"),
        options: toOptions(facets.actions),
      },
      {
        type: "multiSelect",
        key: "resourceType",
        label: t("auditLogs.filters.resource"),
        options: toOptions(facets.resourceTypes),
      },
      {
        type: "multiSelect",
        key: "actorType",
        label: t("auditLogs.filters.actorType"),
        options: toOptions(facets.actorTypes),
      },
      {
        type: "text",
        key: "actor",
        label: t("auditLogs.filters.actor"),
      },
      {
        type: "dateRange",
        key: "createdAt",
        label: t("auditLogs.filters.date"),
      },
    ],
    [facets, t],
  );

  return (
    <DataTable
      id="admin-audit-logs"
      query={query}
      columns={columns}
      filters={filters}
      result={auditLogs}
      defaultSort="createdAt.desc"
      getRowId={(auditLog) => auditLog.id}
      emptyMessage={t("auditLogs.empty")}
      exportHref="/api/v1/private/admin/audit-logs/export"
      searchPlaceholder={t("auditLogs.filters.search")}
    />
  );
};

function toOptions(values: string[]) {
  return values.map((value) => ({ value, label: value }));
}
