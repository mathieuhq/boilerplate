import { beforeEach, describe, expect, it, vi } from "vitest";

import { getFullAccess } from "@/shared/domain/access-control";

import type { IAdminRoleRepository } from "../../domain/repositories/admin-role.repository.interface";
import type {
  AdminUserListItem,
  IAdminRepository,
} from "../../domain/repositories/admin.repository.interface";
import type { AdminOperationError } from "../errors/admin-operation.error";
import { UnbanAdminUserUseCase } from "../use-cases/unban-admin-user.use-case";

import { createMockAdminRepository } from "./admin-repository.mock";
import { createMockAdminRoleRepository } from "./admin-role-repository.mock";

describe("UnbanAdminUserUseCase", () => {
  let useCase: UnbanAdminUserUseCase;
  let mockAdminRepository: IAdminRepository;
  let mockRoleRepository: IAdminRoleRepository;

  beforeEach(() => {
    mockAdminRepository = createMockAdminRepository();
    mockRoleRepository = createMockAdminRoleRepository();
    useCase = new UnbanAdminUserUseCase(
      mockAdminRepository,
      mockRoleRepository,
    );
  });

  it("should unban a user and write an audit log", async () => {
    const user = createUser({ banned: false });
    vi.mocked(mockAdminRepository.getUserSecurityState).mockResolvedValue({
      id: "user-1",
      role: "user",
      banned: true,
    });
    vi.mocked(mockAdminRepository.unbanUser).mockResolvedValue(user);

    const result = await useCase.execute({
      actorUserId: "admin-1",
      actorAccess: getFullAccess(),
      userId: "user-1",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.user).toEqual(user);
    expect(mockAdminRepository.unbanUser).toHaveBeenCalledWith({
      userId: "user-1",
    });
    expect(mockAdminRepository.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin-1",
        action: "admin.user.unbanned",
        resourceId: "user-1",
      }),
    );
  });

  it("should reject unbanning an admin without full access", async () => {
    vi.mocked(mockAdminRepository.getUserSecurityState).mockResolvedValue({
      id: "admin-2",
      role: "admin",
      banned: true,
    });

    const result = await useCase.execute({
      actorUserId: "moderator-1",
      actorAccess: { users: "write" },
      userId: "admin-2",
    });

    expect(result.isFailure).toBe(true);
    expect((result.error as AdminOperationError).code).toBe(
      "ADMIN_INSUFFICIENT_PERMISSIONS",
    );
    expect(mockAdminRepository.unbanUser).not.toHaveBeenCalled();
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
    expect(mockAdminRepository.unbanUser).not.toHaveBeenCalled();
  });

  it("should unban a user whose custom role no longer exists", async () => {
    vi.mocked(mockAdminRepository.getUserSecurityState).mockResolvedValue({
      id: "user-2",
      role: "deleted-role",
      banned: true,
    });
    vi.mocked(mockRoleRepository.findRoleByKey).mockResolvedValue(null);
    vi.mocked(mockAdminRepository.unbanUser).mockResolvedValue(createUser());

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
