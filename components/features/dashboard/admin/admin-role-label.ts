import type { AdminRoleDTO } from "@/features/admin/application/dto/admin-role.dto";
import type { useTranslations } from "@/i18n";

export function getAdminRoleLabel(
  role: Pick<AdminRoleDTO, "key" | "name" | "system">,
  t: ReturnType<typeof useTranslations>,
) {
  return role.system ? t(`systemRoles.${role.key}`) : role.name;
}

export function findAdminRoleLabel(
  roles: AdminRoleDTO[],
  key: string,
  t: ReturnType<typeof useTranslations>,
) {
  const role = roles.find((item) => item.key === key);

  return role ? getAdminRoleLabel(role, t) : key;
}
