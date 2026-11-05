import type { IAuditLogPort } from "@/shared/application/ports/audit-log.port";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import { ApiKeyOperationError } from "../errors/api-key-operation.error";
import type { IApiKeyPort } from "../ports/api-key.port";
import type { IAuthProviderPort } from "../ports/auth-provider.port";

type RevokeUserApiKeyInput = {
  keyId: string;
};

type RevokeUserApiKeyOutput = {
  revoked: true;
};

export class RevokeUserApiKeyUseCase implements IUseCase<
  RevokeUserApiKeyInput,
  RevokeUserApiKeyOutput
> {
  constructor(
    private readonly authProvider: IAuthProviderPort,
    private readonly apiKeys: IApiKeyPort,
    private readonly auditLog: IAuditLogPort,
  ) {}

  async execute(
    input: RevokeUserApiKeyInput,
  ): Promise<Result<RevokeUserApiKeyOutput>> {
    const current = await this.authProvider.getSession();

    if (!current)
      return Result.fail(
        new ApiKeyOperationError(
          "API_KEY_SESSION_REQUIRED",
          "A session is required to revoke an API key",
        ),
      );

    if (current.session.impersonatedBy)
      return Result.fail(
        new ApiKeyOperationError(
          "API_KEY_IMPERSONATION_FORBIDDEN",
          "API keys cannot be revoked while impersonating a user",
        ),
      );

    const deleted = await this.apiKeys.deleteApiKey(
      current.user.id,
      input.keyId,
    );

    if (!deleted)
      return Result.fail(
        new ApiKeyOperationError("API_KEY_NOT_FOUND", "API key not found"),
      );

    await this.auditLog.record({
      actorType: "user",
      actorUserId: current.user.id,
      action: "auth.api-key.revoked",
      resourceType: "api_key",
      resourceId: input.keyId,
    });

    return Result.ok({ revoked: true });
  }
}
