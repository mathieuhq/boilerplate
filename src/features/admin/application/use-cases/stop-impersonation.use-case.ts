import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import type { IImpersonationPort } from "@/features/auth/application/ports/impersonation.port";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import { AdminOperationError } from "../errors/admin-operation.error";

type StopImpersonationInput = Record<string, never>;

type StopImpersonationOutput = {
  impersonatedUserId: string;
};

export class StopImpersonationUseCase implements IUseCase<
  StopImpersonationInput,
  StopImpersonationOutput
> {
  constructor(
    private readonly adminRepository: IAdminRepository,
    private readonly authProvider: IAuthProviderPort,
    private readonly impersonation: IImpersonationPort,
  ) {}

  async execute(
    _input: StopImpersonationInput,
  ): Promise<Result<StopImpersonationOutput>> {
    const session = await this.authProvider.getSession();
    const impersonatedBy = session?.session.impersonatedBy;

    if (!session || !impersonatedBy)
      return Result.fail(
        new AdminOperationError(
          "ADMIN_NOT_IMPERSONATING",
          "You are not impersonating anyone",
        ),
      );

    await this.impersonation.stopImpersonation();

    await this.adminRepository.createAuditLog({
      actorType: "user",
      actorUserId: impersonatedBy,
      action: "admin.impersonation.stopped",
      resourceType: "user",
      resourceId: session.user.id,
      metadata: {
        sessionId: session.session.id,
      },
    });

    return Result.ok({ impersonatedUserId: session.user.id });
  }
}
