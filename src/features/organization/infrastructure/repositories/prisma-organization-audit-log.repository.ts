import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import { toPaginatedResult } from "@/shared/domain/list-query";
import {
  containsInsensitive,
  type PrismaListConfig,
  toPrismaDateRange,
  toPrismaListArgs,
} from "@/shared/infrastructure/prisma/prisma-list-query";

import type {
  IOrganizationAuditLogRepository,
  ListOrganizationAuditLogsInput,
  ListOrganizationAuditLogsQuery,
  OrganizationAuditLogEntry,
  OrganizationAuditLogPage,
} from "../../domain/repositories/organization-audit-log.repository.interface";

const AUDIT_LOG_LIST_CONFIG: PrismaListConfig<
  ListOrganizationAuditLogsInput,
  Prisma.AuditLogWhereInput,
  Prisma.AuditLogOrderByWithRelationInput
> = {
  tieBreaker: { id: "desc" },
  defaultSort: { field: "createdAt", direction: "desc" },
  sortable: {
    action: "action",
    createdAt: "createdAt",
  },
  search: (term) => ({
    actorUser: {
      is: {
        OR: [
          { name: containsInsensitive(term) },
          { email: containsInsensitive(term) },
        ],
      },
    },
  }),
  filters: {
    action: (actions) => ({ action: { in: actions } }),
    createdAt: (value) => {
      const bounds = toPrismaDateRange(value);

      return bounds ? { createdAt: bounds } : undefined;
    },
  },
};

export class PrismaOrganizationAuditLogRepository implements IOrganizationAuditLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listByOrganization({
    organizationId,
    ...query
  }: ListOrganizationAuditLogsQuery): Promise<OrganizationAuditLogPage> {
    const { where, orderBy, skip, take, page, pageSize } = toPrismaListArgs(
      query,
      { ...AUDIT_LOG_LIST_CONFIG, where: { organizationId } },
    );

    const [auditLogs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          action: true,
          actorType: true,
          resourceType: true,
          resourceId: true,
          metadata: true,
          createdAt: true,
          actorUser: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return toPaginatedResult({
      page,
      pageSize,
      total,
      items: auditLogs.map((auditLog): OrganizationAuditLogEntry => ({
        id: auditLog.id,
        action: auditLog.action,
        actorType: auditLog.actorType,
        resourceType: auditLog.resourceType,
        resourceId: auditLog.resourceId,
        actorUser: auditLog.actorUser,
        createdAt: auditLog.createdAt.toISOString(),
        metadata: isMetadataObject(auditLog.metadata)
          ? (auditLog.metadata as OrganizationAuditLogEntry["metadata"])
          : null,
      })),
    });
  }
}

function isMetadataObject(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
