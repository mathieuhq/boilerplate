import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";
import {
  type AccessGrants,
  coversAccess,
  normalizeAccessGrants,
} from "@/shared/domain/access-control";

import type { IAdminRoleRepository } from "../../domain/repositories/admin-role.repository.interface";
import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import { isValidRoleKey } from "../../domain/roles";
import { type AdminRoleDTO, toAdminRoleDTO } from "../dto/admin-role.dto";
import { AdminOperationError } from "../errors/admin-operation.error";

type CreateAdminRoleInput = {
  actorUserId: string;
  actorAccess: AccessGrants;
  key: string;
  name: string;
  description?: string;
  access: Partial<Record<string, string>>;
};

type CreateAdminRoleOutput = {
  role: AdminRoleDTO;
};

export class CreateAdminRoleUseCase implements IUseCase<
  CreateAdminRoleInput,
  CreateAdminRoleOutput
> {
  constructor(
    private readonly roleRepository: IAdminRoleRepository,
    private readonly adminRepository: IAdminRepository,
  ) {}

  async execute(
    input: CreateAdminRoleInput,
  ): Promise<Result<CreateAdminRoleOutput>> {
    if (!isValidRoleKey(input.key))
      return Result.fail(
        new AdminOperationError(
          "ADMIN_ROLE_INVALID_KEY",
          "This role key is invalid or reserved",
        ),
      );

    const access = normalizeAccessGrants(input.access);

    if (!coversAccess(input.actorAccess, access))
      return Result.fail(
        new AdminOperationError(
          "ADMIN_INSUFFICIENT_PERMISSIONS",
          "You cannot grant access you do not have",
        ),
      );

    const existingRole = await this.roleRepository.findRoleByKey(input.key);

    if (existingRole)
      return Result.fail(
        new AdminOperationError(
          "ADMIN_ROLE_ALREADY_EXISTS",
          "A role with this key already exists",
        ),
      );

    const role = await this.roleRepository.createRole({
      key: input.key,
      name: input.name,
      description: input.description ?? null,
      access,
    });

    await this.adminRepository.createAuditLog({
      actorType: "user",
      actorUserId: input.actorUserId,
      action: "admin.role.created",
      resourceType: "role",
      resourceId: role.key,
      metadata: {
        name: role.name,
        access: role.access,
      },
    });

    return Result.ok({ role: toAdminRoleDTO(role, 0) });
  }
}
