import { beforeEach, describe, expect, it, vi } from "vitest";

import { getFullAccess } from "@/shared/domain/access-control";

import type { IAdminRoleRepository } from "../../domain/repositories/admin-role.repository.interface";
import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import type { AdminOperationError } from "../errors/admin-operation.error";
import { CreateAdminRoleUseCase } from "../use-cases/create-admin-role.use-case";

import { createMockAdminRepository } from "./admin-repository.mock";
import {
  createCustomRole,
  createMockAdminRoleRepository,
} from "./admin-role-repository.mock";

describe("CreateAdminRoleUseCase", () => {
  let useCase: CreateAdminRoleUseCase;
  let mockAdminRepository: IAdminRepository;
  let mockRoleRepository: IAdminRoleRepository;

  beforeEach(() => {
    mockAdminRepository = createMockAdminRepository();
    mockRoleRepository = createMockAdminRoleRepository();
    useCase = new CreateAdminRoleUseCase(
      mockRoleRepository,
      mockAdminRepository,
    );
  });

  it("should create a role and write an audit log", async () => {
    vi.mocked(mockRoleRepository.findRoleByKey).mockResolvedValue(null);
    vi.mocked(mockRoleRepository.createRole).mockResolvedValue(
      createCustomRole(),
    );

    const result = await useCase.execute({
      actorUserId: "admin-1",
      actorAccess: getFullAccess(),
      key: "support",
      name: "Support",
      access: { users: "write", unknown: "read", overview: "admin" },
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.role).toMatchObject({
      key: "support",
      system: false,
      usersCount: 0,
    });
    expect(mockRoleRepository.createRole).toHaveBeenCalledWith({
      key: "support",
      name: "Support",
      description: null,
      access: { users: "write" },
    });
    expect(mockAdminRepository.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin.role.created",
        resourceType: "role",
        resourceId: "support",
      }),
    );
  });

  it("should reject a reserved key", async () => {
    const result = await useCase.execute({
      actorUserId: "admin-1",
      actorAccess: getFullAccess(),
      key: "admin",
      name: "Admin",
      access: {},
    });

    expect((result.error as AdminOperationError).code).toBe(
      "ADMIN_ROLE_INVALID_KEY",
    );
    expect(mockRoleRepository.createRole).not.toHaveBeenCalled();
  });

  it("should reject granting access the actor lacks", async () => {
    const result = await useCase.execute({
      actorUserId: "manager-1",
      actorAccess: { roles: "write" },
      key: "support",
      name: "Support",
      access: { users: "write" },
    });

    expect((result.error as AdminOperationError).code).toBe(
      "ADMIN_INSUFFICIENT_PERMISSIONS",
    );
  });

  it("should reject a duplicate key", async () => {
    vi.mocked(mockRoleRepository.findRoleByKey).mockResolvedValue(
      createCustomRole(),
    );

    const result = await useCase.execute({
      actorUserId: "admin-1",
      actorAccess: getFullAccess(),
      key: "support",
      name: "Support",
      access: {},
    });

    expect((result.error as AdminOperationError).code).toBe(
      "ADMIN_ROLE_ALREADY_EXISTS",
    );
    expect(mockRoleRepository.createRole).not.toHaveBeenCalled();
  });
});
