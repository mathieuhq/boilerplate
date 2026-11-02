import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import type { IImpersonationPort } from "@/features/auth/application/ports/impersonation.port";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";
import {
  type AccessGrants,
  coversAccess,
  hasAccess,
} from "@/shared/domain/access-control";

import { IMPERSONATION_SESSION_DURATION_SECONDS } from "../../domain/impersonation";
import type { IAdminRoleRepository } from "../../domain/repositories/admin-role.repository.interface";
import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import { ADMIN_ROLE } from "../../domain/roles";
import { AdminOperationError } from "../errors/admin-operation.error";
import { resolveRoleAccess } from "../services/resolve-role-access";

type ImpersonateAdminUserInput = {
  actorUserId: string;
  actorAccess: AccessGrants;
  userId: string;
};

type ImpersonateAdminUserOutput = {
  expiresAt: string;
};

export class ImpersonateAdminUserUseCase implements IUseCase<
  ImpersonateAdminUserInput,
  ImpersonateAdminUserOutput
> {
  constructor(
    private readonly adminRepository: IAdminRepository,
    private readonly roleRepository: IAdminRoleRepository,
    private readonly authProvider: IAuthProviderPort,
    private readonly impersonation: IImpersonationPort,
  ) {}

  async execute(
    input: ImpersonateAdminUserInput,
  ): Promise<Result<ImpersonateAdminUserOutput>> {
    if (!hasAccess(input.actorAccess, "impersonation", "write"))
      return Result.fail(
        new AdminOperationError(
          "ADMIN_INSUFFICIENT_PERMISSIONS",
          "You are not allowed to impersonate users",
        ),
      );

    const session = await this.authProvider.getSession();

    if (session?.session.impersonatedBy)
      return Result.fail(
        new AdminOperationError(
          "ADMIN_ALREADY_IMPERSONATING",
          "Stop the current impersonation first",
        ),
      );

    const targetUser = await this.adminRepository.getUserSecurityState(
      input.userId,
    );

    if (!targetUser)
      return Result.fail(
        new AdminOperationError("ADMIN_USER_NOT_FOUND", "User not found"),
      );

    if (targetUser.id === input.actorUserId)
      return Result.fail(
        new AdminOperationError(
          "ADMIN_CANNOT_IMPERSONATE_SELF",
          "You cannot impersonate yourself",
        ),
      );

    if (targetUser.banned)
      return Result.fail(
        new AdminOperationError(
          "ADMIN_CANNOT_IMPERSONATE_BANNED",
          "Banned users cannot be impersonated",
        ),
      );

    if (targetUser.role === ADMIN_ROLE)
      return Result.fail(
        new AdminOperationError(
          "ADMIN_CANNOT_IMPERSONATE_ADMIN",
          "Admins cannot be impersonated",
        ),
      );

    const targetAccess = await resolveRoleAccess(
      this.roleRepository,
      targetUser.role,
    );

    if (!coversAccess(input.actorAccess, targetAccess ?? {}))
      return Result.fail(
        new AdminOperationError(
          "ADMIN_INSUFFICIENT_PERMISSIONS",
          "You cannot impersonate a user with access you do not have",
        ),
      );

    const { expiresAt } = await this.impersonation.startImpersonation(
      targetUser.id,
      IMPERSONATION_SESSION_DURATION_SECONDS,
    );

    await this.adminRepository.createAuditLog({
      actorType: "user",
      actorUserId: input.actorUserId,
      action: "admin.impersonation.started",
      resourceType: "user",
      resourceId: targetUser.id,
      metadata: {
        role: targetUser.role,
        expiresAt: expiresAt.toISOString(),
        durationSeconds: IMPERSONATION_SESSION_DURATION_SECONDS,
      },
    });

    return Result.ok({ expiresAt: expiresAt.toISOString() });
  }
}
