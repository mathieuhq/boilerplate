import type { AccessGrants } from "@/shared/domain/access-control";

import type { AdminCustomRole } from "../../domain/repositories/admin-role.repository.interface";

export type AdminRoleDTO = {
  key: string;
  name: string;
  description: string | null;
  access: AccessGrants;
  system: boolean;
  usersCount: number;
};

export function toAdminRoleDTO(
  role: AdminCustomRole,
  usersCount: number,
): AdminRoleDTO {
  return {
    key: role.key,
    name: role.name,
    description: role.description,
    access: role.access,
    system: false,
    usersCount,
  };
}
