import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import { type ApiKeyListDTO, toApiKeyDTO } from "../dto/api-key.dto";
import { ApiKeyOperationError } from "../errors/api-key-operation.error";
import type { IApiKeyPort } from "../ports/api-key.port";
import type { IAuthProviderPort } from "../ports/auth-provider.port";

type ListUserApiKeysInput = Record<string, never>;

export class ListUserApiKeysUseCase implements IUseCase<
  ListUserApiKeysInput,
  ApiKeyListDTO
> {
  constructor(
    private readonly authProvider: IAuthProviderPort,
    private readonly apiKeys: IApiKeyPort,
  ) {}

  async execute(_input: ListUserApiKeysInput): Promise<Result<ApiKeyListDTO>> {
    const current = await this.authProvider.getSession();

    if (!current)
      return Result.fail(
        new ApiKeyOperationError(
          "API_KEY_SESSION_REQUIRED",
          "A session is required to list API keys",
        ),
      );

    const records = await this.apiKeys.listApiKeys(current.user.id);

    return Result.ok({
      apiKeys: records.map(toApiKeyDTO),
      canManage: !current.session.impersonatedBy,
    });
  }
}
