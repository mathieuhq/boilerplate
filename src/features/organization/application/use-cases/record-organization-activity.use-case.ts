import type {
  AuditLogMetadata,
  IAuditLogPort,
} from "@/shared/application/ports/audit-log.port";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type {
  OrganizationActivityAction,
  OrganizationActivityResource,
} from "../../domain/organization-activity";
import { OrganizationOperationError } from "../errors/organization-operation.error";

export type RecordOrganizationActivityInput = {
  action: OrganizationActivityAction;
  actorUserId: string;
  organizationId: string;
  resourceType: OrganizationActivityResource;
  resourceId: string;
  impersonatedBy?: string | null;
  metadata?: AuditLogMetadata;
};

type RecordOrganizationActivityOutput = {
  recorded: true;
};

export class RecordOrganizationActivityUseCase implements IUseCase<
  RecordOrganizationActivityInput,
  RecordOrganizationActivityOutput
> {
  constructor(private readonly auditLog: IAuditLogPort) {}

  async execute(
    input: RecordOrganizationActivityInput,
  ): Promise<Result<RecordOrganizationActivityOutput>> {
    if (!input.organizationId || !input.actorUserId)
      return Result.fail(
        new OrganizationOperationError(
          "ORGANIZATION_ACTIVITY_INVALID",
          "Organization activity requires an actor and an organization",
        ),
      );

    await this.auditLog.record({
      actorType: "user",
      actorUserId: input.actorUserId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      organizationId: input.organizationId,
      metadata: {
        ...input.metadata,
        ...(input.impersonatedBy
          ? { impersonatedBy: input.impersonatedBy }
          : {}),
      },
    });

    return Result.ok({ recorded: true });
  }
}
