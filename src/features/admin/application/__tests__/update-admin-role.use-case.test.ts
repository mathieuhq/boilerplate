import { beforeEach, describe, expect, it, vi } from "vitest";

import { getFullAccess } from "@/shared/domain/access-control";

import type { IAdminRoleRepository } from "../../domain/repositories/admin-role.repository.interface";
import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import type { AdminOperationError } from "../errors/admin-operation.error";
import { UpdateAdminRoleUseCase } from "../use-cases/update-admin-role.use-case";

import { createMockAdminRepository } from "./admin-repository.mock";
import {
  createCustomRole,
  createMockAdminRoleRepository,
} from "./admin-role-repository.mock";

describe("UpdateAdminRoleUseCase", () => {
  let useCase: UpdateAdminRoleUseCase;
  let mockAdminRepository: IAdminRepository;
  let mockRoleRepository: IAdminRoleRepository;

  beforeEach(() => {
    mockAdminRepository = createMockAdminRepository();
    mockRoleRepository = createMockAdminRoleRepository();
    useCase = new UpdateAdminRoleUseCase(
      mockRoleRepository,
      mockAdminRepository,
    );
  });

  it("should update a role and write an audit log", async () => {
    vi.mocked(mockRoleRepository.findRoleByKey).mockResolvedValue(
      createCustomRole(),
    );
    vi.mocked(mockRoleRepository.updateRole).mockResolvedValue(
      createCustomRole({ name: "Support team", access: { users: "read" } }),
    );
    vi.mocked(mockRoleRepository.countUsersByRole).mockResolvedValue({
      support: 4,
    });

    const result = await useCase.execute({
      actorUserId: "admin-1",
      actorAccess: getFullAccess(),
      key: "support",
      name: "Support team",
      description: "Handles tickets",
      access: { users: "read" },
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.role.usersCount).toBe(4);
    expect(mockRoleRepository.updateRole).toHaveBeenCalledWith({
      key: "support",
      name: "Support team",
      description: "Handles tickets",
      access: { users: "read" },
    });
    expect(mockAdminRepository.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin.role.updated",
        metadata: expect.objectContaining({
          previousAccess: { users: "write" },
          nextAccess: { users: "read" },
        }),
      }),
    );
  });

  it("should clear the description and count zero users when absent", async () => {
    vi.mocked(mockRoleRepository.findRoleByKey).mockResolvedValue(
      createCustomRole({ description: "Handles tickets" }),
    );
    vi.mocked(mockRoleRepository.updateRole).mockResolvedValue(
      createCustomRole(),
    );
    vi.mocked(mockRoleRepository.countUsersByRole).mockResolvedValue({});

    const result = await useCase.execute({
      actorUserId: "admin-1",
      actorAccess: getFullAccess(),
      key: "support",
      name: "Support",
      access: { users: "write" },
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.role.usersCount).toBe(0);
    expect(mockRoleRepository.updateRole).toHaveBeenCalledWith(
      expect.objectContaining({ description: null }),
    );
  });

  it("should reject the admin role", async () => {
    const result = await useCase.execute({
      actorUserId: "admin-1",
      actorAccess: getFullAccess(),
      key: "admin",
      name: "Admin",
      access: { users: "read" },
    });

    expect((result.error as AdminOperationError).code).toBe(
      "ADMIN_ROLE_SYSTEM",
    );
    expect(mockRoleRepository.updateRole).not.toHaveBeenCalled();
  });

  it("should update the user role access and keep its name", async () => {
    vi.mocked(mockRoleRepository.findRoleByKey).mockResolvedValue(null);
    vi.mocked(mockRoleRepository.updateRole).mockResolvedValue(
      createCustomRole({
        key: "user",
        name: "User",
        access: { users: "read" },
      }),
    );
    vi.mocked(mockRoleRepository.countUsersByRole).mockResolvedValue({
      user: 12,
    });

    const result = await useCase.execute({
      actorUserId: "admin-1",
      actorAccess: getFullAccess(),
      key: "user",
      name: "Renamed",
      description: "Ignored",
      access: { users: "read" },
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.role).toMatchObject({
      key: "user",
      system: true,
      usersCount: 12,
    });
    expect(mockRoleRepository.updateRole).toHaveBeenCalledWith({
      key: "user",
      name: "User",
      description: null,
      access: { users: "read" },
    });
    expect(mockAdminRepository.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceId: "user",
        metadata: expect.objectContaining({
          previousAccess: {},
          nextAccess: { users: "read" },
        }),
      }),
    );
  });

  it("should reject a missing role", async () => {
    vi.mocked(mockRoleRepository.findRoleByKey).mockResolvedValue(null);

    const result = await useCase.execute({
      actorUserId: "admin-1",
      actorAccess: getFullAccess(),
      key: "support",
      name: "Support",
      access: {},
    });

    expect((result.error as AdminOperationError).code).toBe(
      "ADMIN_ROLE_NOT_FOUND",
    );
  });

  it("should reject changing a role with access the actor lacks", async () => {
    vi.mocked(mockRoleRepository.findRoleByKey).mockResolvedValue(
      createCustomRole(),
    );

    const result = await useCase.execute({
      actorUserId: "manager-1",
      actorAccess: { users: "read", roles: "write" },
      key: "support",
      name: "Support",
      access: { users: "read" },
    });

    expect((result.error as AdminOperationError).code).toBe(
      "ADMIN_INSUFFICIENT_PERMISSIONS",
    );
    expect(mockRoleRepository.updateRole).not.toHaveBeenCalled();
  });
});
