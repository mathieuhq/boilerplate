import { beforeEach, describe, expect, it, vi } from "vitest";

import { getFullAccess } from "@/shared/domain/access-control";

import type { IAdminRoleRepository } from "../../domain/repositories/admin-role.repository.interface";
import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import type { AdminOperationError } from "../errors/admin-operation.error";
import { DeleteAdminRoleUseCase } from "../use-cases/delete-admin-role.use-case";

import { createMockAdminRepository } from "./admin-repository.mock";
import {
  createCustomRole,
  createMockAdminRoleRepository,
} from "./admin-role-repository.mock";

describe("DeleteAdminRoleUseCase", () => {
  let useCase: DeleteAdminRoleUseCase;
  let mockAdminRepository: IAdminRepository;
  let mockRoleRepository: IAdminRoleRepository;

  beforeEach(() => {
    mockAdminRepository = createMockAdminRepository();
    mockRoleRepository = createMockAdminRoleRepository();
    useCase = new DeleteAdminRoleUseCase(
      mockRoleRepository,
      mockAdminRepository,
    );
  });

  it("should delete an unused role and write an audit log", async () => {
    vi.mocked(mockRoleRepository.findRoleByKey).mockResolvedValue(
      createCustomRole(),
    );
    vi.mocked(mockRoleRepository.countUsersByRole).mockResolvedValue({
      user: 10,
    });

    const result = await useCase.execute({
      actorUserId: "admin-1",
      actorAccess: getFullAccess(),
      key: "support",
    });

    expect(result.isSuccess).toBe(true);
    expect(mockRoleRepository.deleteRole).toHaveBeenCalledWith("support");
    expect(mockAdminRepository.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin.role.deleted",
        resourceId: "support",
      }),
    );
  });

  it("should reject system roles", async () => {
    const result = await useCase.execute({
      actorUserId: "admin-1",
      actorAccess: getFullAccess(),
      key: "admin",
    });

    expect((result.error as AdminOperationError).code).toBe(
      "ADMIN_ROLE_SYSTEM",
    );
  });

  it("should reject a missing role", async () => {
    vi.mocked(mockRoleRepository.findRoleByKey).mockResolvedValue(null);

    const result = await useCase.execute({
      actorUserId: "admin-1",
      actorAccess: getFullAccess(),
      key: "support",
    });

    expect((result.error as AdminOperationError).code).toBe(
      "ADMIN_ROLE_NOT_FOUND",
    );
  });

  it("should reject deleting a role with access the actor lacks", async () => {
    vi.mocked(mockRoleRepository.findRoleByKey).mockResolvedValue(
      createCustomRole(),
    );

    const result = await useCase.execute({
      actorUserId: "manager-1",
      actorAccess: { roles: "write" },
      key: "support",
    });

    expect((result.error as AdminOperationError).code).toBe(
      "ADMIN_INSUFFICIENT_PERMISSIONS",
    );
  });

  it("should reject deleting a role still assigned to users", async () => {
    vi.mocked(mockRoleRepository.findRoleByKey).mockResolvedValue(
      createCustomRole(),
    );
    vi.mocked(mockRoleRepository.countUsersByRole).mockResolvedValue({
      support: 2,
    });

    const result = await useCase.execute({
      actorUserId: "admin-1",
      actorAccess: getFullAccess(),
      key: "support",
    });

    expect((result.error as AdminOperationError).code).toBe(
      "ADMIN_ROLE_IN_USE",
    );
    expect(mockRoleRepository.deleteRole).not.toHaveBeenCalled();
  });
});
