import { count, desc, eq, inArray, or } from "drizzle-orm";

import type { Database } from "@/lib/db";
import { auditLog, user } from "@/lib/schema";
import { toPaginatedResult } from "@/shared/domain/list-query";
import {
  containsInsensitive,
  type DrizzleListConfig,
  toDateRangeWhere,
  toDrizzleListArgs,
} from "@/shared/infrastructure/drizzle/drizzle-list-query";

import type {
  IOrganizationAuditLogRepository,
  ListOrganizationAuditLogsInput,
  ListOrganizationAuditLogsQuery,
  OrganizationAuditLogEntry,
  OrganizationAuditLogPage,
} from "../../domain/repositories/organization-audit-log.repository.interface";

const AUDIT_LOG_LIST_CONFIG: DrizzleListConfig<ListOrganizationAuditLogsInput> =
  {
    id: auditLog.id,
    tieBreaker: desc(auditLog.id),
    defaultSort: { field: "createdAt", direction: "desc" },
    sortable: {
      action: auditLog.action,
      createdAt: auditLog.createdAt,
    },
    search: (term) =>
      or(
        containsInsensitive(user.name, term),
        containsInsensitive(user.email, term),
      ),
    filters: {
      action: (actions) => inArray(auditLog.action, actions),
      createdAt: (value) => toDateRangeWhere(auditLog.createdAt, value),
    },
  };

export class DrizzleOrganizationAuditLogRepository implements IOrganizationAuditLogRepository {
  constructor(private readonly db: Database) {}

  async listByOrganization({
    organizationId,
    ...query
  }: ListOrganizationAuditLogsQuery): Promise<OrganizationAuditLogPage> {
    const { where, orderBy, offset, limit, page, pageSize } = toDrizzleListArgs(
      query,
      {
        ...AUDIT_LOG_LIST_CONFIG,
        where: eq(auditLog.organizationId, organizationId),
      },
    );
    const actorUserJoin = eq(auditLog.actorUserId, user.id);

    const [auditLogs, [{ total }]] = await Promise.all([
      this.db
        .select({
          id: auditLog.id,
          action: auditLog.action,
          actorType: auditLog.actorType,
          resourceType: auditLog.resourceType,
          resourceId: auditLog.resourceId,
          metadata: auditLog.metadata,
          createdAt: auditLog.createdAt,
          actorUser: { id: user.id, name: user.name, email: user.email },
        })
        .from(auditLog)
        .leftJoin(user, actorUserJoin)
        .where(where)
        .orderBy(...orderBy)
        .offset(offset)
        .limit(limit),
      this.db
        .select({ total: count() })
        .from(auditLog)
        .leftJoin(user, actorUserJoin)
        .where(where),
    ]);

    return toPaginatedResult({
      page,
      pageSize,
      total,
      items: auditLogs.map((entry): OrganizationAuditLogEntry => ({
        id: entry.id,
        action: entry.action,
        actorType: entry.actorType,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        actorUser: entry.actorUser,
        createdAt: entry.createdAt.toISOString(),
        metadata: isMetadataObject(entry.metadata)
          ? (entry.metadata as OrganizationAuditLogEntry["metadata"])
          : null,
      })),
    });
  }
}

function isMetadataObject(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
