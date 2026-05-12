import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import type { AdminUserListItemDTO } from "../dto/admin-user-list-item.dto";
import { AdminOperationError } from "../errors/admin-operation.error";

type UnbanAdminUserInput = {
  actorUserId: string;
  userId: string;
};

type UnbanAdminUserOutput = {
  user: AdminUserListItemDTO;
};

export class UnbanAdminUserUseCase implements IUseCase<
  UnbanAdminUserInput,
  UnbanAdminUserOutput
> {
  constructor(private readonly adminRepository: IAdminRepository) {}

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
