import type { AuthenticateApiKeyUseCase } from "../../application/use-cases/authenticate-api-key.use-case";
import type { CreateUserApiKeyUseCase } from "../../application/use-cases/create-user-api-key.use-case";
import type { ListUserApiKeysUseCase } from "../../application/use-cases/list-user-api-keys.use-case";
import type { RevokeUserApiKeyUseCase } from "../../application/use-cases/revoke-user-api-key.use-case";

export class ApiKeyController {
  constructor(
    private readonly listUserApiKeysUseCase: ListUserApiKeysUseCase,
    private readonly createUserApiKeyUseCase: CreateUserApiKeyUseCase,
    private readonly revokeUserApiKeyUseCase: RevokeUserApiKeyUseCase,
    private readonly authenticateApiKeyUseCase: AuthenticateApiKeyUseCase,
  ) {}

  async authenticate(key: string | null) {
    const result = await this.authenticateApiKeyUseCase.execute({ key });

    return result.unwrap();
  }

  async listApiKeys() {
    const result = await this.listUserApiKeysUseCase.execute({});

    return result.unwrap();
  }

  async createApiKey(input: { name: string }) {
    const result = await this.createUserApiKeyUseCase.execute(input);

    return result.unwrap();
  }

  async revokeApiKey(input: { keyId: string }) {
    const result = await this.revokeUserApiKeyUseCase.execute(input);

    return result.unwrap();
  }
}
