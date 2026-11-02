export const ADMIN_ROLE = "admin";
export const USER_ROLE = "user";

const SYSTEM_ROLE_KEYS = [ADMIN_ROLE, USER_ROLE] as const;

export type SystemRoleKey = (typeof SYSTEM_ROLE_KEYS)[number];

export const ROLE_KEY_PATTERN = /^[a-z][a-z0-9-]{1,31}$/;

export function isSystemRoleKey(key: string): key is SystemRoleKey {
  return (SYSTEM_ROLE_KEYS as readonly string[]).includes(key);
}

export function isValidRoleKey(key: string) {
  return ROLE_KEY_PATTERN.test(key) && !isSystemRoleKey(key);
}

export function isEditableRoleKey(key: string) {
  return key !== ADMIN_ROLE;
}

export function normalizeRoleKey(role: string | null | undefined) {
  const key = role?.trim();

  if (!key) return USER_ROLE;

  return key;
}
