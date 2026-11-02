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

export type OrganizationAuditLogPage = {
  items: OrganizationAuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
};

export type ListOrganizationAuditLogsQuery = {
  organizationId: string;
  page: number;
  limit: number;
};

export type IOrganizationAuditLogRepository = {
  listByOrganization: (
    query: ListOrganizationAuditLogsQuery,
  ) => Promise<OrganizationAuditLogPage>;
};
