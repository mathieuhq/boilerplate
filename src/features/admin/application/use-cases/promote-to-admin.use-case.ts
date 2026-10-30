import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { getBootstrapAdminEmails } from "@/lib/env";
import { logger } from "@/lib/logger";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

type PromoteToAdminInput = {
  userId: string;
  email: string;
  emailVerified: boolean;
  role?: string | null;
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
    if (!input.emailVerified) return Result.ok({ promoted: false });

    if (input.role === "admin") return Result.ok({ promoted: false });

    const adminEmails = getBootstrapAdminEmails();
    const normalizedEmail = input.email.trim().toLowerCase();

    if (!adminEmails.has(normalizedEmail))
      return Result.ok({ promoted: false });

    try {
      await this.authProvider.setUserRole(input.userId, "admin");

      logger.info("User promoted to admin (configured admin)", {
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
