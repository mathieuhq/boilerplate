import type { TranslationFn } from "@/i18n/translator";
import type { CsvColumn } from "@/shared/infrastructure/csv/csv";

import type { AdminAuditLogDTO } from "../../application/dto/admin-audit-log.dto";
import type { AdminOrganizationListItemDTO } from "../../application/dto/admin-organization-list-item.dto";
import type { AdminUserListItemDTO } from "../../application/dto/admin-user-list-item.dto";

export function getAdminUserCsvColumns(
  t: TranslationFn,
): CsvColumn<AdminUserListItemDTO>[] {
  return [
    { header: t("id"), value: (user) => user.id },
    { header: t("name"), value: (user) => user.name },
    { header: t("email"), value: (user) => user.email },
    { header: t("role"), value: (user) => user.role },
    { header: t("emailVerified"), value: (user) => user.emailVerified },
    { header: t("banned"), value: (user) => user.banned },
    { header: t("banReason"), value: (user) => user.banReason },
    { header: t("banExpires"), value: (user) => user.banExpires },
    { header: t("activeSessions"), value: (user) => user.activeSessionsCount },
    { header: t("lastLoginAt"), value: (user) => user.lastLoginAt },
    { header: t("createdAt"), value: (user) => user.createdAt },
  ];
}

export function getAdminOrganizationCsvColumns(
  t: TranslationFn,
): CsvColumn<AdminOrganizationListItemDTO>[] {
  return [
    { header: t("id"), value: (organization) => organization.id },
    { header: t("name"), value: (organization) => organization.name },
    { header: t("slug"), value: (organization) => organization.slug },
    {
      header: t("ownerName"),
      value: (organization) => organization.owner?.name,
    },
    {
      header: t("ownerEmail"),
      value: (organization) => organization.owner?.email,
    },
    {
      header: t("members"),
      value: (organization) => organization.membersCount,
    },
    {
      header: t("pendingInvitations"),
      value: (organization) => organization.pendingInvitationsCount,
    },
    {
      header: t("createdAt"),
      value: (organization) => organization.createdAt,
    },
  ];
}

export function getAdminAuditLogCsvColumns(
  t: TranslationFn,
): CsvColumn<AdminAuditLogDTO>[] {
  return [
    { header: t("id"), value: (auditLog) => auditLog.id },
    { header: t("createdAt"), value: (auditLog) => auditLog.createdAt },
    { header: t("action"), value: (auditLog) => auditLog.action },
    { header: t("actorType"), value: (auditLog) => auditLog.actorType },
    { header: t("actorId"), value: (auditLog) => auditLog.actorUserId },
    { header: t("actorName"), value: (auditLog) => auditLog.actorUser?.name },
    {
      header: t("actorEmail"),
      value: (auditLog) => auditLog.actorUser?.email,
    },
    { header: t("resourceType"), value: (auditLog) => auditLog.resourceType },
    { header: t("resourceId"), value: (auditLog) => auditLog.resourceId },
    {
      header: t("organization"),
      value: (auditLog) => auditLog.organization?.name,
    },
    {
      header: t("metadata"),
      value: (auditLog) =>
        auditLog.metadata ? JSON.stringify(auditLog.metadata) : null,
    },
  ];
}
