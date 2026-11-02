import type { IAuditLogPort } from "@/shared/application/ports/audit-log.port";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import { SessionOperationError } from "../errors/session-operation.error";
import type { IAuthProviderPort } from "../ports/auth-provider.port";
import type { ISessionManagementPort } from "../ports/session-management.port";
import {
  describeSession,
  toSessionEntity,
} from "../services/to-session-entity";

type RevokeOtherUserSessionsInput = Record<string, never>;

type RevokeOtherUserSessionsOutput = {
  revokedCount: number;
};

export class RevokeOtherUserSessionsUseCase implements IUseCase<
  RevokeOtherUserSessionsInput,
  RevokeOtherUserSessionsOutput
> {
  constructor(
    private readonly authProvider: IAuthProviderPort,
    private readonly sessionManagement: ISessionManagementPort,
    private readonly auditLog: IAuditLogPort,
  ) {}

  async execute(
    _input: RevokeOtherUserSessionsInput,
  ): Promise<Result<RevokeOtherUserSessionsOutput>> {
    const current = await this.authProvider.getSession();

    if (!current)
      return Result.fail(
        new SessionOperationError(
          "SESSION_REQUIRED",
          "A session is required to revoke sessions",
        ),
      );

    if (current.session.impersonatedBy)
      return Result.fail(
        new SessionOperationError(
          "SESSION_IMPERSONATION_FORBIDDEN",
          "Sessions cannot be revoked while impersonating a user",
        ),
      );

    const records = await this.sessionManagement.listSessions(current.user.id);
    const others = records
      .map(toSessionEntity)
      .filter(
        (session) => session.id !== current.session.id && !session.isExpired,
      );

    await this.sessionManagement.revokeOtherSessions();

    await this.auditLog.record({
      actorType: "user",
      actorUserId: current.user.id,
      action: "auth.session.revoked-others",
      resourceType: "session",
      resourceId: current.session.id,
      metadata: {
        revokedCount: others.length,
        sessions: others.map(describeSession),
      },
    });

    return Result.ok({ revokedCount: others.length });
  }
}
