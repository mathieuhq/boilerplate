import { useMemo } from "react";
import { format } from "date-fns";

import { DataTable } from "@/components/features/data-table/data-table";
import type {
  DataTableColumn,
  DataTableFilter,
} from "@/components/features/data-table/data-table.types";
import { Badge } from "@/components/ui/badge";
import {
  isOrganizationActivityAction,
  ORGANIZATION_ACTIVITY_ACTIONS,
  type OrganizationActivityAction,
} from "@/features/organization/domain/organization-activity";
import type {
  ListOrganizationAuditLogsInput,
  OrganizationAuditLogEntry,
  OrganizationAuditLogPage,
} from "@/features/organization/domain/repositories/organization-audit-log.repository.interface";
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
  query: ListOrganizationAuditLogsInput;
  auditLogs: OrganizationAuditLogPage | null;
};

export const OrganizationActivityTable = ({
  query,
  auditLogs,
}: OrganizationActivityTableProps) => {
  const t = useTranslations("organization.activity");

  const columns = useMemo<DataTableColumn<OrganizationAuditLogEntry>[]>(
    () => [
      {
        id: "action",
        header: t("table.action"),
        sortable: true,
        hideable: false,
        cell: (auditLog) => (
          <p className="font-medium">
            {isOrganizationActivityAction(auditLog.action)
              ? t(`actions.${ACTION_LABEL_KEYS[auditLog.action]}`)
              : auditLog.action}
          </p>
        ),
      },
      {
        id: "actor",
        header: t("table.actor"),
        cell: (auditLog) =>
          auditLog.actorUser ? (
            <div className="max-w-64 min-w-0">
              <p className="truncate">{auditLog.actorUser.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {auditLog.actorUser.email}
              </p>
            </div>
          ) : (
            <Badge variant="outline">
              {auditLog.actorType === "system" ? t("system") : t("deletedUser")}
            </Badge>
          ),
      },
      {
        id: "details",
        header: t("table.details"),
        cell: (auditLog) => (
          <OrganizationActivityDetails metadata={auditLog.metadata} />
        ),
      },
      {
        id: "createdAt",
        header: t("table.date"),
        sortable: true,
        cellClassName: "text-sm whitespace-nowrap text-muted-foreground",
        cell: (auditLog) => format(new Date(auditLog.createdAt), "PPp"),
      },
    ],
    [t],
  );

  const filters = useMemo<DataTableFilter[]>(
    () => [
      {
        type: "multiSelect",
        key: "action",
        label: t("table.action"),
        options: ORGANIZATION_ACTIVITY_ACTIONS.map((action) => ({
          value: action,
          label: t(`actions.${ACTION_LABEL_KEYS[action]}`),
        })),
      },
      {
        type: "dateRange",
        key: "createdAt",
        label: t("table.date"),
      },
    ],
    [t],
  );

  return (
    <DataTable
      id="organization-activity"
      query={query}
      columns={columns}
      filters={filters}
      result={auditLogs}
      defaultSort="createdAt.desc"
      getRowId={(auditLog) => auditLog.id}
      emptyMessage={t("empty")}
      searchPlaceholder={t("search")}
    />
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
