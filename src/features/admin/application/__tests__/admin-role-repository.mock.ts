import { vi } from "vitest";

import type {
  AdminCustomRole,
  IAdminRoleRepository,
} from "../../domain/repositories/admin-role.repository.interface";

export function createMockAdminRoleRepository(): IAdminRoleRepository {
  return {
    listRoles: vi.fn(),
    createRole: vi.fn(),
    updateRole: vi.fn(),
    deleteRole: vi.fn(),
    findRoleByKey: vi.fn(),
    countUsersByRole: vi.fn(),
  };
}

export function createCustomRole(
  overrides: Partial<AdminCustomRole> = {},
): AdminCustomRole {
  return {
    key: "support",
    name: "Support",
    description: null,
    access: { users: "write" },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}
