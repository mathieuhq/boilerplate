import type { OrganizationAuditLogPage } from "../../domain/repositories/organization-audit-log.repository.interface";

export type OrganizationAuditLogListDTO = {
  organization: {
    id: string;
    name: string;
  };
  auditLogs: OrganizationAuditLogPage;
};
