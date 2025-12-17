import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

type PromoteToAdminInput = {
  userId: string;
  email: string;
};

type PromoteToAdminOutput = {
  promoted: boolean;
};

export class PromoteToAdminUseCase implements IUseCase<
  PromoteToAdminInput,
  PromoteToAdminOutput
> {
  constructor(private readonly authProvider: IAuthProviderPort) {}

  async execute(
    input: PromoteToAdminInput,
  ): Promise<Result<PromoteToAdminOutput>> {
    if (!env.BETTER_AUTH_ADMIN_EMAIL) return Result.ok({ promoted: false });

    if (input.email.toLowerCase() !== env.BETTER_AUTH_ADMIN_EMAIL.toLowerCase())
      return Result.ok({ promoted: false });

    try {
      await this.authProvider.setUserRole(input.userId, "admin");

      logger.info("User promoted to admin (original admin)", {
        email: input.email,
        userId: input.userId,
      });

      return Result.ok({ promoted: true });
    } catch (error) {
      logger.error("Failed to promote user to admin", {
        error,
        email: input.email,
        userId: input.userId,
      });

      return Result.ok({ promoted: false });
    }
  }
}
