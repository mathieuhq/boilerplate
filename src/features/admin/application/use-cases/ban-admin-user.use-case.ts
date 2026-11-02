import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";
import {
  type AccessGrants,
  coversAccess,
} from "@/shared/domain/access-control";

import type { IAdminRoleRepository } from "../../domain/repositories/admin-role.repository.interface";
import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import { ADMIN_ROLE } from "../../domain/roles";
import type { AdminUserListItemDTO } from "../dto/admin-user-list-item.dto";
import { AdminOperationError } from "../errors/admin-operation.error";
import { resolveRoleAccess } from "../services/resolve-role-access";

type BanAdminUserInput = {
  actorUserId: string;
  actorAccess: AccessGrants;
  userId: string;
  reason?: string;
  expiresAt?: Date | null;
};

type BanAdminUserOutput = {
  user: AdminUserListItemDTO;
};

export class BanAdminUserUseCase implements IUseCase<
  BanAdminUserInput,
  BanAdminUserOutput
> {
  constructor(
    private readonly adminRepository: IAdminRepository,
    private readonly roleRepository: IAdminRoleRepository,
    private readonly authProvider: IAuthProviderPort,
  ) {}

  async execute(input: BanAdminUserInput): Promise<Result<BanAdminUserOutput>> {
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
          "ADMIN_CANNOT_BAN_SELF",
          "You cannot ban your own admin account",
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
          "You cannot ban a user with access you do not have",
        ),
      );

    if (targetUser.role === ADMIN_ROLE && !targetUser.banned) {
      const activeAdmins = await this.adminRepository.countActiveAdmins();

      if (activeAdmins <= 1)
        return Result.fail(
          new AdminOperationError(
            "ADMIN_LAST_ADMIN",
            "The platform must keep at least one active admin",
          ),
        );
    }

    const user = await this.adminRepository.banUser({
      userId: input.userId,
      reason: input.reason,
      expiresAt: input.expiresAt,
    });

    await this.authProvider.revokeUserSessions(input.userId);

    await this.adminRepository.createAuditLog({
      actorType: "user",
      actorUserId: input.actorUserId,
      action: "admin.user.banned",
      resourceType: "user",
      resourceId: input.userId,
      metadata: {
        previousBanned: targetUser.banned,
        reason: input.reason ?? null,
        expiresAt: input.expiresAt?.toISOString() ?? null,
      },
    });

    return Result.ok({ user });
  }
}
