import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type {
  AuthSession,
  IAuthProviderPort,
} from "../ports/auth-provider.port";

type GetSessionInput = Record<string, never>;

export class GetSessionUseCase implements IUseCase<
  GetSessionInput,
  AuthSession | null
> {
  constructor(private readonly authProvider: IAuthProviderPort) {}

  async execute(_input: GetSessionInput): Promise<Result<AuthSession | null>> {
    const session = await this.authProvider.getSession();

    return Result.ok(session);
  }
}
