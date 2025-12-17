import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type { AuthUser, IAuthProviderPort } from "../ports/auth-provider.port";

type GetCurrentUserInput = Record<string, never>;

export class GetCurrentUserUseCase implements IUseCase<
  GetCurrentUserInput,
  AuthUser | null
> {
  constructor(private readonly authProvider: IAuthProviderPort) {}

  async execute(_input: GetCurrentUserInput): Promise<Result<AuthUser | null>> {
    const user = await this.authProvider.getUser();
    return Result.ok(user);
  }
}
