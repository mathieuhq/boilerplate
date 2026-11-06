import type { Database } from "@/lib/db";
import { auditLog } from "@/lib/schema";
import type {
  AuditLogEntry,
  IAuditLogPort,
} from "@/shared/application/ports/audit-log.port";

export class DrizzleAuditLogAdapter implements IAuditLogPort {
  constructor(private readonly db: Database) {}

  async record(entry: AuditLogEntry): Promise<void> {
    await this.db.insert(auditLog).values({
      actorUserId: entry.actorUserId,
      actorType: entry.actorType,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId ?? null,
      organizationId: entry.organizationId ?? null,
      metadata: entry.metadata,
    });
  }
}
