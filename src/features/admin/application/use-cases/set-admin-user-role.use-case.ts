import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type {
  AdminUserRole,
  IAdminRepository,
} from "../../domain/repositories/admin.repository.interface";
import type { AdminUserListItemDTO } from "../dto/admin-user-list-item.dto";
import { AdminOperationError } from "../errors/admin-operation.error";

type SetAdminUserRoleInput = {
  actorUserId: string;
  userId: string;
  role: AdminUserRole;
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

    if (targetUser.role === "admin" && input.role === "user") {
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
      role: input.role,
      userId: input.userId,
    });

    if (targetUser.role !== input.role)
      await this.authProvider.revokeUserSessions(input.userId);

    await this.adminRepository.createAuditLog({
      actorType: "user",
      actorUserId: input.actorUserId,
      action: "admin.user.role_updated",
      resourceType: "user",
      resourceId: input.userId,
      metadata: {
        previousRole: targetUser.role,
        nextRole: input.role,
      },
    });

    return Result.ok({ user });
  }
}
