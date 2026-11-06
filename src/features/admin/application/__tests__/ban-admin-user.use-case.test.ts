import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { getFullAccess } from "@/shared/domain/access-control";
import { createMockAuthProvider } from "@/test/utils/mock-factories";

import type { IAdminRoleRepository } from "../../domain/repositories/admin-role.repository.interface";
import type {
  AdminUserListItem,
  IAdminRepository,
} from "../../domain/repositories/admin.repository.interface";
import type { AdminOperationError } from "../errors/admin-operation.error";
import { BanAdminUserUseCase } from "../use-cases/ban-admin-user.use-case";

import { createMockAdminRepository } from "./admin-repository.mock";
import {
  createCustomRole,
  createMockAdminRoleRepository,
} from "./admin-role-repository.mock";

describe("BanAdminUserUseCase", () => {
  let useCase: BanAdminUserUseCase;
  let mockAdminRepository: IAdminRepository;
  let mockRoleRepository: IAdminRoleRepository;
  let mockAuthProvider: IAuthProviderPort;

  beforeEach(() => {
    mockAdminRepository = createMockAdminRepository();
    mockRoleRepository = createMockAdminRoleRepository();
    mockAuthProvider = createMockAuthProvider();
    useCase = new BanAdminUserUseCase(
      mockAdminRepository,
      mockRoleRepository,
      mockAuthProvider,
    );
  });

  it("should ban a user and write an audit log", async () => {
    const bannedUser = createUser({ banned: true });
    vi.mocked(mockAdminRepository.getUserSecurityState).mockResolvedValue({
      id: "user-1",
      role: "user",
      banned: false,
    });
    vi.mocked(mockAdminRepository.banUser).mockResolvedValue(bannedUser);

    const result = await useCase.execute({
      actorUserId: "admin-1",
      actorAccess: getFullAccess(),
      userId: "user-1",
      reason: "abuse",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.user).toEqual(bannedUser);
    expect(mockAdminRepository.banUser).toHaveBeenCalledWith({
      userId: "user-1",
      reason: "abuse",
      expiresAt: undefined,
    });
    expect(mockAdminRepository.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin-1",
        action: "admin.user.banned",
        resourceId: "user-1",
      }),
    );
    expect(mockAuthProvider.revokeUserSessions).toHaveBeenCalledWith("user-1");
  });

  it("should reject self-ban", async () => {
    vi.mocked(mockAdminRepository.getUserSecurityState).mockResolvedValue({
      id: "admin-1",
      role: "admin",
      banned: false,
    });

    const result = await useCase.execute({
      actorUserId: "admin-1",
      actorAccess: getFullAccess(),
      userId: "admin-1",
    });

    expect(result.isFailure).toBe(true);
    expect((result.error as AdminOperationError).code).toBe(
      "ADMIN_CANNOT_BAN_SELF",
    );
    expect(mockAdminRepository.banUser).not.toHaveBeenCalled();
    expect(mockAuthProvider.revokeUserSessions).not.toHaveBeenCalled();
  });

  it("should reject banning the last active admin", async () => {
    vi.mocked(mockAdminRepository.getUserSecurityState).mockResolvedValue({
      id: "admin-2",
      role: "admin",
      banned: false,
    });
    vi.mocked(mockAdminRepository.banUser).mockResolvedValue(null);

    const result = await useCase.execute({
      actorUserId: "admin-1",
      actorAccess: getFullAccess(),
      userId: "admin-2",
    });

    expect(result.isFailure).toBe(true);
    expect((result.error as AdminOperationError).code).toBe("ADMIN_LAST_ADMIN");
    expect(mockAdminRepository.banUser).toHaveBeenCalledTimes(1);
    expect(mockAuthProvider.revokeUserSessions).not.toHaveBeenCalled();
    expect(mockAdminRepository.createAuditLog).not.toHaveBeenCalled();
  });

  it("should reject banning a user with access the actor lacks", async () => {
    vi.mocked(mockAdminRepository.getUserSecurityState).mockResolvedValue({
      id: "user-2",
      role: "support",
      banned: false,
    });
    vi.mocked(mockRoleRepository.findRoleByKey).mockResolvedValue(
      createCustomRole(),
    );
    vi.mocked(mockAdminRepository.banUser).mockResolvedValue(createUser());

    const result = await useCase.execute({
      actorUserId: "moderator-1",
      actorAccess: { users: "write" },
      userId: "user-2",
    });

    expect(result.isSuccess).toBe(true);

    vi.mocked(mockRoleRepository.findRoleByKey).mockResolvedValue(
      createCustomRole({ access: { users: "read", roles: "write" } }),
    );

    const rejected = await useCase.execute({
      actorUserId: "moderator-1",
      actorAccess: { users: "write" },
      userId: "user-2",
    });

    expect(rejected.isFailure).toBe(true);
    expect((rejected.error as AdminOperationError).code).toBe(
      "ADMIN_INSUFFICIENT_PERMISSIONS",
    );
    expect(mockAdminRepository.banUser).toHaveBeenCalledTimes(1);
  });

  it("should return not found when the user does not exist", async () => {
    vi.mocked(mockAdminRepository.getUserSecurityState).mockResolvedValue(null);

    const result = await useCase.execute({
      actorUserId: "admin-1",
      actorAccess: getFullAccess(),
      userId: "missing",
    });

    expect(result.isFailure).toBe(true);
    expect((result.error as AdminOperationError).code).toBe(
      "ADMIN_USER_NOT_FOUND",
    );
    expect(mockAdminRepository.banUser).not.toHaveBeenCalled();
  });

  it("should ban an admin when other active admins remain", async () => {
    const bannedUser = createUser({
      id: "admin-2",
      role: "admin",
      banned: true,
    });
    vi.mocked(mockAdminRepository.getUserSecurityState).mockResolvedValue({
      id: "admin-2",
      role: "admin",
      banned: false,
    });
    vi.mocked(mockAdminRepository.banUser).mockResolvedValue(bannedUser);

    const result = await useCase.execute({
      actorUserId: "admin-1",
      actorAccess: getFullAccess(),
      userId: "admin-2",
      expiresAt: new Date("2026-02-01T00:00:00.000Z"),
    });

    expect(result.isSuccess).toBe(true);
    expect(mockAdminRepository.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          previousBanned: false,
          reason: null,
          expiresAt: "2026-02-01T00:00:00.000Z",
        },
      }),
    );
  });

  it("should ban a user whose custom role no longer exists", async () => {
    vi.mocked(mockAdminRepository.getUserSecurityState).mockResolvedValue({
      id: "user-2",
      role: "deleted-role",
      banned: false,
    });
    vi.mocked(mockRoleRepository.findRoleByKey).mockResolvedValue(null);
    vi.mocked(mockAdminRepository.banUser).mockResolvedValue(createUser());

    const result = await useCase.execute({
      actorUserId: "moderator-1",
      actorAccess: { users: "write" },
      userId: "user-2",
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
