import { format } from "date-fns";

import { AdminPagination } from "@/components/features/dashboard/admin/admin-pagination";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OrganizationAuditLogListDTO } from "@/features/organization/application/dto/organization-audit-log.dto";
import {
  isOrganizationActivityAction,
  type OrganizationActivityAction,
} from "@/features/organization/domain/organization-activity";
import type { OrganizationAuditLogEntry } from "@/features/organization/domain/repositories/organization-audit-log.repository.interface";
import { useTranslations } from "@/i18n";

const ACTION_LABEL_KEYS: Record<OrganizationActivityAction, string> = {
  "organization.created": "organizationCreated",
  "organization.updated": "organizationUpdated",
  "organization.invitation.created": "invitationCreated",
  "organization.invitation.canceled": "invitationCanceled",
  "organization.invitation.accepted": "invitationAccepted",
  "organization.invitation.rejected": "invitationRejected",
  "organization.member.removed": "memberRemoved",
  "organization.member.role-updated": "memberRoleUpdated",
  "organization.member.left": "memberLeft",
};

type OrganizationActivityTableProps = {
  auditLogs: OrganizationAuditLogListDTO["auditLogs"];
  limit: number;
};

export const OrganizationActivityTable = ({
  auditLogs,
  limit,
}: OrganizationActivityTableProps) => {
  const t = useTranslations("organization.activity");

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="px-4">{t("table.action")}</TableHead>
              <TableHead className="hidden px-4 md:table-cell">
                {t("table.actor")}
              </TableHead>
              <TableHead className="hidden px-4 lg:table-cell">
                {t("table.details")}
              </TableHead>
              <TableHead className="px-4 text-right">
                {t("table.date")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.items.length > 0 ? (
              auditLogs.items.map((auditLog) => (
                <OrganizationActivityRow
                  key={auditLog.id}
                  auditLog={auditLog}
                />
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 px-4 text-center text-muted-foreground"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <AdminPagination
        search={{ limit }}
        page={auditLogs.page}
        pageCount={auditLogs.pageCount}
        basePath="/settings/organization-activity"
      />
    </div>
  );
};

const OrganizationActivityRow = ({
  auditLog,
}: {
  auditLog: OrganizationAuditLogEntry;
}) => {
  const t = useTranslations("organization.activity");
  const actor = auditLog.actorUser;

  return (
    <TableRow>
      <TableCell className="px-4 py-3">
        <p className="font-medium">
          {isOrganizationActivityAction(auditLog.action)
            ? t(`actions.${ACTION_LABEL_KEYS[auditLog.action]}`)
            : auditLog.action}
        </p>
        <p className="truncate text-sm text-muted-foreground md:hidden">
          {actor?.name ?? t("deletedUser")}
        </p>
      </TableCell>
      <TableCell className="hidden px-4 py-3 md:table-cell">
        {actor ? (
          <div className="min-w-0">
            <p className="truncate">{actor.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {actor.email}
            </p>
          </div>
        ) : (
          <Badge variant="outline">
            {auditLog.actorType === "system" ? t("system") : t("deletedUser")}
          </Badge>
        )}
      </TableCell>
      <TableCell className="hidden px-4 py-3 lg:table-cell">
        <OrganizationActivityDetails metadata={auditLog.metadata} />
      </TableCell>
      <TableCell className="px-4 py-3 text-right text-sm whitespace-nowrap text-muted-foreground">
        {format(new Date(auditLog.createdAt), "PPp")}
      </TableCell>
    </TableRow>
  );
};

const OrganizationActivityDetails = ({
  metadata,
}: {
  metadata: OrganizationAuditLogEntry["metadata"];
}) => {
  const t = useTranslations("organization.activity");
  const tRoles = useTranslations("organization.roles");

  const fields = Array.isArray(metadata?.fields)
    ? metadata.fields.filter((field) => typeof field === "string")
    : [];
  const email = typeof metadata?.email === "string" ? metadata.email : null;
  const role = typeof metadata?.role === "string" ? metadata.role : null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {email && <Badge variant="outline">{email}</Badge>}
      {role && <Badge variant="outline">{tRoles(role)}</Badge>}
      {fields.length > 0 && (
        <Badge variant="outline">
          {t("fields", { fields: fields.join(", ") })}
        </Badge>
      )}
      {metadata?.impersonatedBy && (
        <Badge variant="secondary">{t("impersonatedBy")}</Badge>
      )}
    </div>
  );
};
