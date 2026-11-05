import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import { ApiKeyOperationError } from "../errors/api-key-operation.error";
import type { IApiKeyPort } from "../ports/api-key.port";

type AuthenticateApiKeyInput = {
  key: string | null;
};

type AuthenticateApiKeyOutput = {
  keyId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string | null;
  };
};

export class AuthenticateApiKeyUseCase implements IUseCase<
  AuthenticateApiKeyInput,
  AuthenticateApiKeyOutput
> {
  constructor(private readonly apiKeys: IApiKeyPort) {}

  async execute(
    input: AuthenticateApiKeyInput,
  ): Promise<Result<AuthenticateApiKeyOutput>> {
    if (!input.key) return Result.fail(invalidApiKey());

    const verification = await this.apiKeys.verifyApiKey(input.key);

    if (verification.status === "rate_limited")
      return Result.fail(
        new ApiKeyOperationError(
          "API_KEY_RATE_LIMITED",
          "Too many requests for this API key",
        ),
      );

    if (verification.status === "invalid") return Result.fail(invalidApiKey());

    const { owner } = verification;
    const isBanned =
      owner.banned &&
      (!owner.banExpires || owner.banExpires.getTime() > Date.now());

    if (isBanned) return Result.fail(invalidApiKey());

    return Result.ok({
      keyId: verification.keyId,
      user: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
      },
    });
  }
}

function invalidApiKey() {
  return new ApiKeyOperationError("API_KEY_INVALID", "Invalid API key");
}
