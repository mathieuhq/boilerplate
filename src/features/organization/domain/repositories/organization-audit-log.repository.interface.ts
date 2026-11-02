import type { ListQuery, PaginatedResult } from "@/shared/domain/list-query";

import type { OrganizationAuditLogSortField } from "../organization-activity";

type OrganizationAuditLogMetadataValue =
  | null
  | string
  | number
  | boolean
  | OrganizationAuditLogMetadataValue[]
  | { [key: string]: OrganizationAuditLogMetadataValue };

export type OrganizationAuditLogEntry = {
  id: string;
  action: string;
  actorType: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, OrganizationAuditLogMetadataValue> | null;
  createdAt: string;
  actorUser: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type OrganizationAuditLogPage =
  PaginatedResult<OrganizationAuditLogEntry>;

export type ListOrganizationAuditLogsInput =
  ListQuery<OrganizationAuditLogSortField> & {
    action?: string[];
    createdAt?: string;
  };

export type ListOrganizationAuditLogsQuery = ListOrganizationAuditLogsInput & {
  organizationId: string;
};

export type IOrganizationAuditLogRepository = {
  listByOrganization: (
    query: ListOrganizationAuditLogsQuery,
  ) => Promise<OrganizationAuditLogPage>;
};
