export const ORGANIZATION_ACTIVITY_ACTIONS = [
  "organization.created",
  "organization.updated",
  "organization.invitation.created",
  "organization.invitation.canceled",
  "organization.invitation.accepted",
  "organization.invitation.rejected",
  "organization.member.removed",
  "organization.member.role-updated",
  "organization.member.left",
] as const;

export const ORGANIZATION_AUDIT_LOG_SORT_FIELDS = [
  "action",
  "createdAt",
] as const;

export type OrganizationAuditLogSortField =
  (typeof ORGANIZATION_AUDIT_LOG_SORT_FIELDS)[number];

export type OrganizationActivityAction =
  (typeof ORGANIZATION_ACTIVITY_ACTIONS)[number];

export type OrganizationActivityResource =
  | "organization"
  | "invitation"
  | "member";

export function isOrganizationActivityAction(
  value: string,
): value is OrganizationActivityAction {
  return (ORGANIZATION_ACTIVITY_ACTIONS as readonly string[]).includes(value);
}
