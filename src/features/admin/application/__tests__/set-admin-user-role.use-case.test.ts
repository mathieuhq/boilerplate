import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { getFullAccess } from "@/shared/domain/access-control";
import { createMockAuthProvider } from "@/test/utils/mock-factories";

import type { IAdminRoleRepository } from "../../domain/repositories/admin-role.repository.interface";
import type {
  AdminUserListItem,
  IAdminRepository,
} from "../../domain/repositories/admin.repository.interface";
import { AdminOperationError } from "../errors/admin-operation.error";
import { SetAdminUserRoleUseCase } from "../use-cases/set-admin-user-role.use-case";

import { createMockAdminRepository } from "./admin-repository.mock";
import {
  createCustomRole,
  createMockAdminRoleRepository,
} from "./admin-role-repository.mock";

describe("SetAdminUserRoleUseCase", () => {
  let useCase: SetAdminUserRoleUseCase;
  let mockAdminRepository: IAdminRepository;
  let mockRoleRepository: IAdminRoleRepository;
  let mockAuthProvider: IAuthProviderPort;

  beforeEach(() => {
    mockAdminRepository = createMockAdminRepository();
    mockRoleRepository = createMockAdminRoleRepository();
    mockAuthProvider = createMockAuthProvider();
    useCase = new SetAdminUserRoleUseCase(
      mockAdminRepository,
      mockRoleRepository,
      mockAuthProvider,
    );
  });

  it("should promote a user and write an audit log", async () => {
    const updatedUser = createUser({ role: "admin" });
    vi.mocked(mockAdminRepository.getUserSecurityState).mockResolvedValue({
      id: "user-1",
      role: "user",
      banned: false,
    });
    vi.mocked(mockAdminRepository.setUserRole).mockResolvedValue(updatedUser);

    const result = await useCase.execute({
      actorUserId: "admin-1",
      actorAccess: getFullAccess(),
      userId: "user-1",
      role: "admin",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.user).toEqual(updatedUser);
    expect(mockAdminRepository.setUserRole).toHaveBeenCalledWith({
      userId: "user-1",
      role: "admin",
    });
    expect(mockAdminRepository.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin-1",
        action: "admin.user.role_updated",
        resourceId: "user-1",
      }),
    );
    expect(mockAuthProvider.revokeUserSessions).toHaveBeenCalledWith("user-1");
  });

  it("should revoke the sessions of a demoted admin", async () => {
    vi.mocked(mockAdminRepository.getUserSecurityState).mockResolvedValue({
      id: "admin-2",
      role: "admin",
      banned: false,
    });
    vi.mocked(mockAdminRepository.countActiveAdmins).mockResolvedValue(2);
    vi.mocked(mockAdminRepository.setUserRole).mockResolvedValue(
      createUser({ id: "admin-2" }),
    );

    const result = await useCase.execute({
      actorUserId: "admin-1",
      actorAccess: getFullAccess(),
      userId: "admin-2",
      role: "user",
    });

    expect(result.isSuccess).toBe(true);
    expect(mockAuthProvider.revokeUserSessions).toHaveBeenCalledWith("admin-2");
  });

  it("should keep sessions when the role does not change", async () => {
    vi.mocked(mockAdminRepository.getUserSecurityState).mockResolvedValue({
      id: "user-1",
      role: "user",
      banned: false,
    });
    vi.mocked(mockAdminRepository.setUserRole).mockResolvedValue(createUser());

    await useCase.execute({
      actorUserId: "admin-1",
      actorAccess: getFullAccess(),
      userId: "user-1",
      role: "user",
    });

    expect(mockAuthProvider.revokeUserSessions).not.toHaveBeenCalled();
  });

  it("should reject demoting the last active admin", async () => {
    vi.mocked(mockAdminRepository.getUserSecurityState).mockResolvedValue({
      id: "admin-1",
      role: "admin",
      banned: false,
    });
    vi.mocked(mockAdminRepository.countActiveAdmins).mockResolvedValue(1);

    const result = await useCase.execute({
      actorUserId: "admin-1",
      actorAccess: getFullAccess(),
      userId: "admin-1",
      role: "user",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(AdminOperationError);
    expect((result.error as AdminOperationError).code).toBe("ADMIN_LAST_ADMIN");
    expect(mockAdminRepository.setUserRole).not.toHaveBeenCalled();
    expect(mockAdminRepository.createAuditLog).not.toHaveBeenCalled();
  });

  it("should assign a custom role", async () => {
    vi.mocked(mockAdminRepository.getUserSecurityState).mockResolvedValue({
      id: "user-1",
      role: "user",
      banned: false,
    });
    vi.mocked(mockRoleRepository.findRoleByKey).mockResolvedValue(
      createCustomRole(),
    );
    vi.mocked(mockAdminRepository.setUserRole).mockResolvedValue(
      createUser({ role: "support" }),
    );

    const result = await useCase.execute({
      actorUserId: "manager-1",
      actorAccess: { users: "write" },
      userId: "user-1",
      role: "support",
    });

    expect(result.isSuccess).toBe(true);
    expect(mockAdminRepository.setUserRole).toHaveBeenCalledWith({
      userId: "user-1",
      role: "support",
    });
  });

  it("should reject an unknown role", async () => {
    vi.mocked(mockAdminRepository.getUserSecurityState).mockResolvedValue({
      id: "user-1",
      role: "user",
      banned: false,
    });
    vi.mocked(mockRoleRepository.findRoleByKey).mockResolvedValue(null);

    const result = await useCase.execute({
      actorUserId: "admin-1",
      actorAccess: getFullAccess(),
      userId: "user-1",
      role: "ghost",
    });

    expect(result.isFailure).toBe(true);
    expect((result.error as AdminOperationError).code).toBe(
      "ADMIN_ROLE_NOT_FOUND",
    );
  });

  it("should reject granting access the actor lacks", async () => {
    vi.mocked(mockAdminRepository.getUserSecurityState).mockResolvedValue({
      id: "user-1",
      role: "user",
      banned: false,
    });

    const result = await useCase.execute({
      actorUserId: "manager-1",
      actorAccess: { users: "write" },
      userId: "user-1",
      role: "admin",
    });

    expect(result.isFailure).toBe(true);
    expect((result.error as AdminOperationError).code).toBe(
      "ADMIN_INSUFFICIENT_PERMISSIONS",
    );
    expect(mockAdminRepository.setUserRole).not.toHaveBeenCalled();
  });

  it("should reject changing the role of a more privileged user", async () => {
    vi.mocked(mockAdminRepository.getUserSecurityState).mockResolvedValue({
      id: "admin-2",
      role: "admin",
      banned: false,
    });

    const result = await useCase.execute({
      actorUserId: "manager-1",
      actorAccess: { users: "write" },
      userId: "admin-2",
      role: "user",
    });

    expect(result.isFailure).toBe(true);
    expect((result.error as AdminOperationError).code).toBe(
      "ADMIN_INSUFFICIENT_PERMISSIONS",
    );
  });

  it("should return not found when the user does not exist", async () => {
    vi.mocked(mockAdminRepository.getUserSecurityState).mockResolvedValue(null);

    const result = await useCase.execute({
      actorUserId: "admin-1",
      actorAccess: getFullAccess(),
      userId: "missing",
      role: "admin",
    });

    expect(result.isFailure).toBe(true);
    expect((result.error as AdminOperationError).code).toBe(
      "ADMIN_USER_NOT_FOUND",
    );
    expect(mockAdminRepository.setUserRole).not.toHaveBeenCalled();
  });

  it("should reassign a user whose custom role no longer exists", async () => {
    vi.mocked(mockAdminRepository.getUserSecurityState).mockResolvedValue({
      id: "user-2",
      role: "deleted-role",
      banned: false,
    });
    vi.mocked(mockRoleRepository.findRoleByKey).mockResolvedValue(null);
    vi.mocked(mockAdminRepository.setUserRole).mockResolvedValue(createUser());

    const result = await useCase.execute({
      actorUserId: "moderator-1",
      actorAccess: { users: "write" },
      userId: "user-2",
      role: "user",
    });

    expect(result.isSuccess).toBe(true);
  });
});

function createUser(
  overrides: Partial<AdminUserListItem> = {},
): AdminUserListItem {
  return {
    id: "user-1",
    name: "User",
    email: "user@example.com",
    role: "user",
    banned: false,
    banReason: null,
    banExpires: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    lastLoginAt: null,
    emailVerified: true,
    activeSessionsCount: 0,
    ...overrides,
  };
}
