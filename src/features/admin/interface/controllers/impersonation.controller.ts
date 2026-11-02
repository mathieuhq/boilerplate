import type { AccessGrants } from "@/shared/domain/access-control";

import type { ImpersonateAdminUserUseCase } from "../../application/use-cases/impersonate-admin-user.use-case";
import type { StopImpersonationUseCase } from "../../application/use-cases/stop-impersonation.use-case";

export class ImpersonationController {
  constructor(
    private readonly impersonateAdminUserUseCase: ImpersonateAdminUserUseCase,
    private readonly stopImpersonationUseCase: StopImpersonationUseCase,
  ) {}

  async impersonateUser(input: {
    actorUserId: string;
    actorAccess: AccessGrants;
    userId: string;
  }) {
    const result = await this.impersonateAdminUserUseCase.execute(input);

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async stopImpersonation() {
    const result = await this.stopImpersonationUseCase.execute({});

    if (result.isFailure) throw result.error;

    return result.value;
  }
}
