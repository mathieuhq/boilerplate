import { useState } from "react";

import { AdminPagination } from "@/components/features/dashboard/admin/admin-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  AdminAuditLogDTO,
  AdminAuditLogListDTO,
} from "@/features/admin/application/dto/admin-audit-log.dto";
import { useTranslations } from "@/i18n";
import { useRouter } from "@/lib/navigation";
import { formatDate } from "@/lib/utils";

type AdminAuditLogsTableProps = {
  auditLogs: AdminAuditLogListDTO;
  filters: AdminAuditLogFilters;
};

export type AdminAuditLogFilters = {
  page: number;
  limit: number;
  action?: string;
  actorUserId?: string;
  resourceType?: string;
  from?: string;
  to?: string;
};

export const AdminAuditLogsTable = ({
  filters,
  auditLogs,
}: AdminAuditLogsTableProps) => {
  return (
    <div className="space-y-4">
      <AdminAuditLogsFilters filters={filters} />
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <AdminAuditLogsTableHeader />
          <TableBody>
            {auditLogs.items.length > 0 ? (
              auditLogs.items.map((auditLog) => (
                <AdminAuditLogsTableRow key={auditLog.id} auditLog={auditLog} />
              ))
            ) : (
              <AdminAuditLogsEmptyRow />
            )}
          </TableBody>
        </Table>
      </div>
      <AdminPagination
        basePath="/admin/audit-logs"
        page={auditLogs.page}
        pageCount={auditLogs.pageCount}
        search={filters}
      />
    </div>
  );
};

const AdminAuditLogsFilters = ({
  filters,
}: {
  filters: AdminAuditLogFilters;
}) => {
  const t = useTranslations("admin");
  const router = useRouter();
  const [action, setAction] = useState(filters.action ?? "");
  const [actorUserId, setActorUserId] = useState(filters.actorUserId ?? "");
  const [resourceType, setResourceType] = useState(filters.resourceType ?? "");
  const [from, setFrom] = useState(filters.from ?? "");
  const [to, setTo] = useState(filters.to ?? "");

  return (
    <form
      className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_10rem_10rem_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(
          buildAuditLogsHref({
            page: 1,
            limit: filters.limit,
            action,
            actorUserId,
            resourceType,
            from,
            to,
          }),
        );
      }}
    >
      <Input
        value={action}
        placeholder={t("auditLogs.filters.action")}
        onChange={(event) => setAction(event.target.value)}
      />
      <Input
        value={actorUserId}
        placeholder={t("auditLogs.filters.actor")}
        onChange={(event) => setActorUserId(event.target.value)}
      />
      <Input
        value={resourceType}
        placeholder={t("auditLogs.filters.resource")}
        onChange={(event) => setResourceType(event.target.value)}
      />
      <Input
        type="date"
        value={from}
        aria-label={t("auditLogs.filters.from")}
        onChange={(event) => setFrom(event.target.value)}
      />
      <Input
        type="date"
        value={to}
        aria-label={t("auditLogs.filters.to")}
        onChange={(event) => setTo(event.target.value)}
      />
      <Button type="submit">{t("actions.apply")}</Button>
    </form>
  );
};

const AdminAuditLogsTableHeader = () => {
  const t = useTranslations("admin");

  return (
    <TableHeader className="bg-muted/50">
      <TableRow>
        <TableHead className="px-4">{t("auditLogs.table.action")}</TableHead>
        <TableHead className="hidden px-4 md:table-cell">
          {t("auditLogs.table.actor")}
        </TableHead>
        <TableHead className="hidden px-4 lg:table-cell">
          {t("auditLogs.table.resource")}
        </TableHead>
        <TableHead className="hidden px-4 xl:table-cell">
          {t("auditLogs.table.date")}
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

const AdminAuditLogsTableRow = ({
  auditLog,
}: {
  auditLog: AdminAuditLogDTO;
}) => {
  return (
    <TableRow>
      <TableCell className="px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{auditLog.action}</p>
          {auditLog.organization && (
            <p className="text-muted-foreground truncate text-sm">
              {auditLog.organization.name}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell className="hidden px-4 py-3 md:table-cell">
        {auditLog.actorUser ? (
          <div className="min-w-0">
            <p className="truncate">{auditLog.actorUser.name}</p>
            <p className="text-muted-foreground truncate text-sm">
              {auditLog.actorUser.email}
            </p>
          </div>
        ) : (
          <Badge variant="outline">{auditLog.actorType}</Badge>
        )}
      </TableCell>
      <TableCell className="hidden px-4 py-3 lg:table-cell">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{auditLog.resourceType}</Badge>
          {auditLog.resourceId && (
            <Badge variant="outline">{auditLog.resourceId}</Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground hidden px-4 py-3 text-sm xl:table-cell">
        {formatDate(auditLog.createdAt)}
      </TableCell>
    </TableRow>
  );
};

const AdminAuditLogsEmptyRow = () => {
  const t = useTranslations("admin");

  return (
    <TableRow>
      <TableCell
        colSpan={4}
        className="text-muted-foreground h-24 px-4 text-center"
      >
        {t("auditLogs.empty")}
      </TableCell>
    </TableRow>
  );
};

function buildAuditLogsHref(filters: AdminAuditLogFilters) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters) as [string, unknown][]) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }

  return `/admin/audit-logs?${params.toString()}`;
}
