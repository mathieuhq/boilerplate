import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";
import { getFullAccess } from "@/shared/domain/access-control";

import type { IAdminRoleRepository } from "../../domain/repositories/admin-role.repository.interface";
import { ADMIN_ROLE, USER_ROLE } from "../../domain/roles";
import { type AdminRoleDTO, toAdminRoleDTO } from "../dto/admin-role.dto";

type ListAdminRolesOutput = {
  roles: AdminRoleDTO[];
};

export class ListAdminRolesUseCase implements IUseCase<
  void,
  ListAdminRolesOutput
> {
  constructor(private readonly roleRepository: IAdminRoleRepository) {}

  async execute(): Promise<Result<ListAdminRolesOutput>> {
    const [storedRoles, usersByRole] = await Promise.all([
      this.roleRepository.listRoles(),
      this.roleRepository.countUsersByRole(),
    ]);

    const userRole = storedRoles.find((role) => role.key === USER_ROLE);
    const customRoles = storedRoles.filter((role) => role.key !== USER_ROLE);

    const systemRoles: AdminRoleDTO[] = [
      {
        key: ADMIN_ROLE,
        name: "Admin",
        description: null,
        access: getFullAccess(),
        system: true,
        usersCount: usersByRole[ADMIN_ROLE] ?? 0,
      },
      {
        key: USER_ROLE,
        name: "User",
        description: null,
        access: userRole?.access ?? {},
        system: true,
        usersCount: usersByRole[USER_ROLE] ?? 0,
      },
    ];

    return Result.ok({
      roles: [
        ...systemRoles,
        ...customRoles.map((role) =>
          toAdminRoleDTO(role, usersByRole[role.key] ?? 0),
        ),
      ],
    });
  }
}
