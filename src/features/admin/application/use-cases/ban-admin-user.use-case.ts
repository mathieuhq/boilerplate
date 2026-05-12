import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import type { AdminUserListItemDTO } from "../dto/admin-user-list-item.dto";
import { AdminOperationError } from "../errors/admin-operation.error";

type BanAdminUserInput = {
  actorUserId: string;
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
  constructor(private readonly adminRepository: IAdminRepository) {}

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

    if (targetUser.role === "admin" && !targetUser.banned) {
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
