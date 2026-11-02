import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";
import {
  type AccessGrants,
  coversAccess,
} from "@/shared/domain/access-control";

import type { IAdminRoleRepository } from "../../domain/repositories/admin-role.repository.interface";
import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import { ADMIN_ROLE, normalizeRoleKey } from "../../domain/roles";
import type { AdminUserListItemDTO } from "../dto/admin-user-list-item.dto";
import { AdminOperationError } from "../errors/admin-operation.error";
import { resolveRoleAccess } from "../services/resolve-role-access";

type SetAdminUserRoleInput = {
  actorUserId: string;
  actorAccess: AccessGrants;
  userId: string;
  role: string;
};

type SetAdminUserRoleOutput = {
  user: AdminUserListItemDTO;
};

export class SetAdminUserRoleUseCase implements IUseCase<
  SetAdminUserRoleInput,
  SetAdminUserRoleOutput
> {
  constructor(
    private readonly adminRepository: IAdminRepository,
    private readonly roleRepository: IAdminRoleRepository,
    private readonly authProvider: IAuthProviderPort,
  ) {}

  async execute(
    input: SetAdminUserRoleInput,
  ): Promise<Result<SetAdminUserRoleOutput>> {
    const targetUser = await this.adminRepository.getUserSecurityState(
      input.userId,
    );

    if (!targetUser)
      return Result.fail(
        new AdminOperationError("ADMIN_USER_NOT_FOUND", "User not found"),
      );

    const nextRole = normalizeRoleKey(input.role);
    const [currentAccess, nextAccess] = await Promise.all([
      resolveRoleAccess(this.roleRepository, targetUser.role),
      resolveRoleAccess(this.roleRepository, nextRole),
    ]);

    if (!nextAccess)
      return Result.fail(
        new AdminOperationError("ADMIN_ROLE_NOT_FOUND", "Role not found"),
      );

    if (
      !coversAccess(input.actorAccess, currentAccess ?? {}) ||
      !coversAccess(input.actorAccess, nextAccess)
    )
      return Result.fail(
        new AdminOperationError(
          "ADMIN_INSUFFICIENT_PERMISSIONS",
          "You cannot assign or revoke access you do not have",
        ),
      );

    if (targetUser.role === ADMIN_ROLE && nextRole !== ADMIN_ROLE) {
      const activeAdmins = await this.adminRepository.countActiveAdmins();

      if (activeAdmins <= 1)
        return Result.fail(
          new AdminOperationError(
            "ADMIN_LAST_ADMIN",
            "The platform must keep at least one active admin",
          ),
        );
    }

    const user = await this.adminRepository.setUserRole({
      role: nextRole,
      userId: input.userId,
    });

    if (targetUser.role !== nextRole)
      await this.authProvider.revokeUserSessions(input.userId);

    await this.adminRepository.createAuditLog({
      actorType: "user",
      actorUserId: input.actorUserId,
      action: "admin.user.role_updated",
      resourceType: "user",
      resourceId: input.userId,
      metadata: {
        previousRole: targetUser.role,
        nextRole,
      },
    });

    return Result.ok({ user });
  }
}
