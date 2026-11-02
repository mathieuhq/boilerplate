import {
  type AccessGrants,
  getFullAccess,
} from "@/shared/domain/access-control";

import type { IAdminRoleRepository } from "../../domain/repositories/admin-role.repository.interface";
import { ADMIN_ROLE, normalizeRoleKey, USER_ROLE } from "../../domain/roles";

export async function resolveRoleAccess(
  roleRepository: IAdminRoleRepository,
  role: string | null | undefined,
): Promise<AccessGrants | null> {
  const key = normalizeRoleKey(role);

  if (key === ADMIN_ROLE) return getFullAccess();

  const storedRole = await roleRepository.findRoleByKey(key);

  if (storedRole) return storedRole.access;

  return key === USER_ROLE ? {} : null;
}
