import type { PaginatedResult } from "@/shared/domain/list-query";

import type {
  AdminAuditLog,
  AdminAuditLogFacets,
} from "../../domain/repositories/admin.repository.interface";

export type AdminAuditLogDTO = AdminAuditLog;

export type AdminAuditLogListDTO = PaginatedResult<AdminAuditLogDTO>;

export type AdminAuditLogFacetsDTO = AdminAuditLogFacets;
