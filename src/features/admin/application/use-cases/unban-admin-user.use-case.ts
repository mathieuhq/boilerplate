import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";
import {
  type AccessGrants,
  coversAccess,
} from "@/shared/domain/access-control";

import type { IAdminRoleRepository } from "../../domain/repositories/admin-role.repository.interface";
import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import type { AdminUserListItemDTO } from "../dto/admin-user-list-item.dto";
import { AdminOperationError } from "../errors/admin-operation.error";
import { resolveRoleAccess } from "../services/resolve-role-access";

type UnbanAdminUserInput = {
  actorUserId: string;
  actorAccess: AccessGrants;
  userId: string;
};

type UnbanAdminUserOutput = {
  user: AdminUserListItemDTO;
};

export class UnbanAdminUserUseCase implements IUseCase<
  UnbanAdminUserInput,
  UnbanAdminUserOutput
> {
  constructor(
    private readonly adminRepository: IAdminRepository,
    private readonly roleRepository: IAdminRoleRepository,
  ) {}

  async execute(
    input: UnbanAdminUserInput,
  ): Promise<Result<UnbanAdminUserOutput>> {
    const targetUser = await this.adminRepository.getUserSecurityState(
      input.userId,
    );

    if (!targetUser)
      return Result.fail(
        new AdminOperationError("ADMIN_USER_NOT_FOUND", "User not found"),
      );

    const targetAccess = await resolveRoleAccess(
      this.roleRepository,
      targetUser.role,
    );

    if (!coversAccess(input.actorAccess, targetAccess ?? {}))
      return Result.fail(
        new AdminOperationError(
          "ADMIN_INSUFFICIENT_PERMISSIONS",
          "You cannot unban a user with access you do not have",
        ),
      );

    const user = await this.adminRepository.unbanUser({
      userId: input.userId,
    });

    await this.adminRepository.createAuditLog({
      actorType: "user",
      actorUserId: input.actorUserId,
      action: "admin.user.unbanned",
      resourceType: "user",
      resourceId: input.userId,
      metadata: {
        previousBanned: targetUser.banned,
      },
    });

    return Result.ok({ user });
  }
}
