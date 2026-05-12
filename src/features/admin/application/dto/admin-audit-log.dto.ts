import type {
  AdminAuditLog,
  AdminListResult,
} from "../../domain/repositories/admin.repository.interface";

export type AdminAuditLogDTO = AdminAuditLog;

export type AdminAuditLogListDTO = AdminListResult<AdminAuditLogDTO>;
