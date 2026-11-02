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

type RevokeUserSessionInput = {
  sessionId: string;
};

type RevokeUserSessionOutput = {
  revoked: true;
};

export class RevokeUserSessionUseCase implements IUseCase<
  RevokeUserSessionInput,
  RevokeUserSessionOutput
> {
  constructor(
    private readonly authProvider: IAuthProviderPort,
    private readonly sessionManagement: ISessionManagementPort,
    private readonly auditLog: IAuditLogPort,
  ) {}

  async execute(
    input: RevokeUserSessionInput,
  ): Promise<Result<RevokeUserSessionOutput>> {
    const current = await this.authProvider.getSession();

    if (!current)
      return Result.fail(
        new SessionOperationError(
          "SESSION_REQUIRED",
          "A session is required to revoke a session",
        ),
      );

    if (current.session.impersonatedBy)
      return Result.fail(
        new SessionOperationError(
          "SESSION_IMPERSONATION_FORBIDDEN",
          "Sessions cannot be revoked while impersonating a user",
        ),
      );

    if (input.sessionId === current.session.id)
      return Result.fail(
        new SessionOperationError(
          "SESSION_IS_CURRENT",
          "Sign out to end the current session",
        ),
      );

    const records = await this.sessionManagement.listSessions(current.user.id);
    const record = records.find(
      (candidate) =>
        candidate.id === input.sessionId &&
        candidate.userId === current.user.id,
    );

    if (!record)
      return Result.fail(
        new SessionOperationError("SESSION_NOT_FOUND", "Session not found"),
      );

    await this.sessionManagement.revokeSession(record.token);

    await this.auditLog.record({
      actorType: "user",
      actorUserId: current.user.id,
      action: "auth.session.revoked",
      resourceType: "session",
      resourceId: record.id,
      metadata: describeSession(toSessionEntity(record)),
    });

    return Result.ok({ revoked: true });
  }
}
