import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";
import {
  type AccessGrants,
  coversAccess,
} from "@/shared/domain/access-control";

import type { IAdminRoleRepository } from "../../domain/repositories/admin-role.repository.interface";
import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import { isSystemRoleKey } from "../../domain/roles";
import { AdminOperationError } from "../errors/admin-operation.error";

type DeleteAdminRoleInput = {
  actorUserId: string;
  actorAccess: AccessGrants;
  key: string;
};

type DeleteAdminRoleOutput = {
  key: string;
};

export class DeleteAdminRoleUseCase implements IUseCase<
  DeleteAdminRoleInput,
  DeleteAdminRoleOutput
> {
  constructor(
    private readonly roleRepository: IAdminRoleRepository,
    private readonly adminRepository: IAdminRepository,
  ) {}

  async execute(
    input: DeleteAdminRoleInput,
  ): Promise<Result<DeleteAdminRoleOutput>> {
    if (isSystemRoleKey(input.key))
      return Result.fail(
        new AdminOperationError(
          "ADMIN_ROLE_SYSTEM",
          "System roles cannot be deleted",
        ),
      );

    const role = await this.roleRepository.findRoleByKey(input.key);

    if (!role)
      return Result.fail(
        new AdminOperationError("ADMIN_ROLE_NOT_FOUND", "Role not found"),
      );

    if (!coversAccess(input.actorAccess, role.access))
      return Result.fail(
        new AdminOperationError(
          "ADMIN_INSUFFICIENT_PERMISSIONS",
          "You cannot delete a role with access you do not have",
        ),
      );

    const usersByRole = await this.roleRepository.countUsersByRole();

    if ((usersByRole[role.key] ?? 0) > 0)
      return Result.fail(
        new AdminOperationError(
          "ADMIN_ROLE_IN_USE",
          "Reassign the users of this role before deleting it",
        ),
      );

    await this.roleRepository.deleteRole(role.key);

    await this.adminRepository.createAuditLog({
      actorType: "user",
      actorUserId: input.actorUserId,
      action: "admin.role.deleted",
      resourceType: "role",
      resourceId: role.key,
      metadata: {
        name: role.name,
        access: role.access,
      },
    });

    return Result.ok({ key: role.key });
  }
}
