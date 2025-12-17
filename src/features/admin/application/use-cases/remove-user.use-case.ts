import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { logger } from "@/lib/logger";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import { ForbiddenActionError } from "../../domain/errors/forbidden-action.error";

type RemoveUserInput = {
  userId: string;
  adminUserId: string;
};

type RemoveUserOutput = {
  success: boolean;
};

export class RemoveUserUseCase implements IUseCase<
  RemoveUserInput,
  RemoveUserOutput
> {
  constructor(private readonly authProvider: IAuthProviderPort) {}

  async execute(input: RemoveUserInput): Promise<Result<RemoveUserOutput>> {
    if (input.userId === input.adminUserId)
      return Result.fail(
        new ForbiddenActionError("Cannot remove your own account"),
      );

    await this.authProvider.removeUser(input.userId);

    logger.info("User removed by admin", {
      removedUserId: input.userId,
      adminUserId: input.adminUserId,
    });

    return Result.ok({ success: true });
  }
}
