import type { PrismaClient } from "@/lib/generated/prisma/client";

import type {
  IOrganizationAuditLogRepository,
  ListOrganizationAuditLogsQuery,
  OrganizationAuditLogEntry,
  OrganizationAuditLogPage,
} from "../../domain/repositories/organization-audit-log.repository.interface";

export class PrismaOrganizationAuditLogRepository implements IOrganizationAuditLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listByOrganization(
    query: ListOrganizationAuditLogsQuery,
  ): Promise<OrganizationAuditLogPage> {
    const where = { organizationId: query.organizationId };

    const [auditLogs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
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
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      total,
      page: query.page,
      limit: query.limit,
      pageCount: Math.max(1, Math.ceil(total / query.limit)),
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
    };
  }
}

function isMetadataObject(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
