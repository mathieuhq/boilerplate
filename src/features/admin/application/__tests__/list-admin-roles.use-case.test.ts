import { beforeEach, describe, expect, it, vi } from "vitest";

import { getFullAccess } from "@/shared/domain/access-control";

import type { IAdminRoleRepository } from "../../domain/repositories/admin-role.repository.interface";
import { ListAdminRolesUseCase } from "../use-cases/list-admin-roles.use-case";

import {
  createCustomRole,
  createMockAdminRoleRepository,
} from "./admin-role-repository.mock";

describe("ListAdminRolesUseCase", () => {
  let useCase: ListAdminRolesUseCase;
  let mockRoleRepository: IAdminRoleRepository;

  beforeEach(() => {
    mockRoleRepository = createMockAdminRoleRepository();
    useCase = new ListAdminRolesUseCase(mockRoleRepository);
  });

  it("should use the stored user role access without listing it twice", async () => {
    vi.mocked(mockRoleRepository.listRoles).mockResolvedValue([
      createCustomRole({
        key: "user",
        name: "User",
        access: { users: "read" },
      }),
      createCustomRole(),
    ]);
    vi.mocked(mockRoleRepository.countUsersByRole).mockResolvedValue({});

    const result = await useCase.execute();

    expect(result.value.roles.map((role) => role.key)).toEqual([
      "admin",
      "user",
      "support",
    ]);
    expect(result.value.roles[1]).toMatchObject({
      system: true,
      access: { users: "read" },
    });
  });

  it("should list system roles before custom roles with user counts", async () => {
    vi.mocked(mockRoleRepository.listRoles).mockResolvedValue([
      createCustomRole(),
      createCustomRole({ key: "auditor", name: "Auditor", access: {} }),
    ]);
    vi.mocked(mockRoleRepository.countUsersByRole).mockResolvedValue({
      admin: 2,
      user: 40,
      support: 3,
    });

    const result = await useCase.execute();

    expect(result.value.roles).toEqual([
      expect.objectContaining({
        key: "admin",
        system: true,
        usersCount: 2,
        access: getFullAccess(),
      }),
      expect.objectContaining({
        key: "user",
        system: true,
        usersCount: 40,
        access: {},
      }),
      expect.objectContaining({ key: "support", system: false, usersCount: 3 }),
      expect.objectContaining({ key: "auditor", system: false, usersCount: 0 }),
    ]);
  });
});
