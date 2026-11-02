export const ADMIN_USER_SORT_FIELDS = [
  "name",
  "email",
  "role",
  "createdAt",
  "lastLoginAt",
] as const;

export const ADMIN_ORGANIZATION_SORT_FIELDS = [
  "name",
  "slug",
  "members",
  "createdAt",
] as const;

export const ADMIN_AUDIT_LOG_SORT_FIELDS = [
  "action",
  "actorType",
  "resourceType",
  "createdAt",
] as const;

export type AdminUserSortField = (typeof ADMIN_USER_SORT_FIELDS)[number];

export type AdminOrganizationSortField =
  (typeof ADMIN_ORGANIZATION_SORT_FIELDS)[number];

export type AdminAuditLogSortField =
  (typeof ADMIN_AUDIT_LOG_SORT_FIELDS)[number];
