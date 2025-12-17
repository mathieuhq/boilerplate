import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { logger } from "@/lib/logger";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

type SetUserPasswordInput = {
  userId: string;
  newPassword: string;
};

type SetUserPasswordOutput = {
  success: boolean;
};

export class SetUserPasswordUseCase implements IUseCase<
  SetUserPasswordInput,
  SetUserPasswordOutput
> {
  constructor(private readonly authProvider: IAuthProviderPort) {}

  async execute(
    input: SetUserPasswordInput,
  ): Promise<Result<SetUserPasswordOutput>> {
    await this.authProvider.setUserPassword(input.userId, input.newPassword);

    logger.info("User password updated by admin", {
      targetUserId: input.userId,
    });

    return Result.ok({ success: true });
  }
}
