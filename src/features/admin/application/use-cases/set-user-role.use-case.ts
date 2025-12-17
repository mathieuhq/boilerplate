import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { logger } from "@/lib/logger";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import { ForbiddenActionError } from "../../domain/errors/forbidden-action.error";

type SetUserRoleInput = {
  userId: string;
  role: "user" | "admin";
  adminUserId: string;
};

type SetUserRoleOutput = {
  success: boolean;
};

export class SetUserRoleUseCase implements IUseCase<
  SetUserRoleInput,
  SetUserRoleOutput
> {
  constructor(private readonly authProvider: IAuthProviderPort) {}

  async execute(input: SetUserRoleInput): Promise<Result<SetUserRoleOutput>> {
    if (input.userId === input.adminUserId) {
      return Result.fail(
        new ForbiddenActionError("Cannot change your own role"),
      );
    }

    await this.authProvider.setUserRole(input.userId, input.role);

    logger.info("User role updated by admin", {
      targetUserId: input.userId,
      newRole: input.role,
      adminUserId: input.adminUserId,
    });

    return Result.ok({ success: true });
  }
}
