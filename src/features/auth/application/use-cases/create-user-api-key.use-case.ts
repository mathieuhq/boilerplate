import type { IAuditLogPort } from "@/shared/application/ports/audit-log.port";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import { type CreatedApiKeyDTO, toApiKeyDTO } from "../dto/api-key.dto";
import { ApiKeyOperationError } from "../errors/api-key-operation.error";
import type { IApiKeyPort } from "../ports/api-key.port";
import type { IAuthProviderPort } from "../ports/auth-provider.port";

type CreateUserApiKeyInput = {
  name: string;
};

export class CreateUserApiKeyUseCase implements IUseCase<
  CreateUserApiKeyInput,
  CreatedApiKeyDTO
> {
  constructor(
    private readonly authProvider: IAuthProviderPort,
    private readonly apiKeys: IApiKeyPort,
    private readonly auditLog: IAuditLogPort,
  ) {}

  async execute(
    input: CreateUserApiKeyInput,
  ): Promise<Result<CreatedApiKeyDTO>> {
    const current = await this.authProvider.getSession();

    if (!current)
      return Result.fail(
        new ApiKeyOperationError(
          "API_KEY_SESSION_REQUIRED",
          "A session is required to create an API key",
        ),
      );

    if (current.session.impersonatedBy)
      return Result.fail(
        new ApiKeyOperationError(
          "API_KEY_IMPERSONATION_FORBIDDEN",
          "API keys cannot be created while impersonating a user",
        ),
      );

    const { record, key } = await this.apiKeys.createApiKey(
      current.user.id,
      input.name,
    );

    await this.auditLog.record({
      actorType: "user",
      actorUserId: current.user.id,
      action: "auth.api-key.created",
      resourceType: "api_key",
      resourceId: record.id,
      metadata: { name: record.name, start: record.start },
    });

    return Result.ok({ apiKey: toApiKeyDTO(record), key });
  }
}
