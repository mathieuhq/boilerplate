import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import type {
  AuditLogEntry,
  IAuditLogPort,
} from "@/shared/application/ports/audit-log.port";

export class PrismaAuditLogAdapter implements IAuditLogPort {
  constructor(private readonly prisma: PrismaClient) {}

  async record(entry: AuditLogEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: entry.actorUserId,
        actorType: entry.actorType,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId ?? null,
        organizationId: entry.organizationId ?? null,
        metadata: entry.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
