import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";
import {
  type AccessGrants,
  coversAccess,
  normalizeAccessGrants,
} from "@/shared/domain/access-control";

import type { IAdminRoleRepository } from "../../domain/repositories/admin-role.repository.interface";
import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import { isEditableRoleKey, USER_ROLE } from "../../domain/roles";
import { type AdminRoleDTO, toAdminRoleDTO } from "../dto/admin-role.dto";
import { AdminOperationError } from "../errors/admin-operation.error";

const DEFAULT_USER_ROLE = {
  name: "User",
  access: {} as AccessGrants,
};

type UpdateAdminRoleInput = {
  actorUserId: string;
  actorAccess: AccessGrants;
  key: string;
  name: string;
  description?: string;
  access: Partial<Record<string, string>>;
};

type UpdateAdminRoleOutput = {
  role: AdminRoleDTO;
};

export class UpdateAdminRoleUseCase implements IUseCase<
  UpdateAdminRoleInput,
  UpdateAdminRoleOutput
> {
  constructor(
    private readonly roleRepository: IAdminRoleRepository,
    private readonly adminRepository: IAdminRepository,
  ) {}

  async execute(
    input: UpdateAdminRoleInput,
  ): Promise<Result<UpdateAdminRoleOutput>> {
    if (!isEditableRoleKey(input.key))
      return Result.fail(
        new AdminOperationError(
          "ADMIN_ROLE_SYSTEM",
          "The admin role cannot be changed",
        ),
      );

    const isUserRole = input.key === USER_ROLE;
    const existingRole =
      (await this.roleRepository.findRoleByKey(input.key)) ??
      (isUserRole ? DEFAULT_USER_ROLE : null);

    if (!existingRole)
      return Result.fail(
        new AdminOperationError("ADMIN_ROLE_NOT_FOUND", "Role not found"),
      );

    const access = normalizeAccessGrants(input.access);

    if (
      !coversAccess(input.actorAccess, existingRole.access) ||
      !coversAccess(input.actorAccess, access)
    )
      return Result.fail(
        new AdminOperationError(
          "ADMIN_INSUFFICIENT_PERMISSIONS",
          "You cannot change a role with access you do not have",
        ),
      );

    const role = await this.roleRepository.updateRole({
      key: input.key,
      name: isUserRole ? DEFAULT_USER_ROLE.name : input.name,
      description: isUserRole ? null : (input.description ?? null),
      access,
    });

    const usersByRole = await this.roleRepository.countUsersByRole();

    await this.adminRepository.createAuditLog({
      actorType: "user",
      actorUserId: input.actorUserId,
      action: "admin.role.updated",
      resourceType: "role",
      resourceId: role.key,
      metadata: {
        previousName: existingRole.name,
        nextName: role.name,
        previousAccess: existingRole.access,
        nextAccess: role.access,
      },
    });

    return Result.ok({
      role: {
        ...toAdminRoleDTO(role, usersByRole[role.key] ?? 0),
        system: isUserRole,
      },
    });
  }
}
