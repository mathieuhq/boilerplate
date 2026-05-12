import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  AdminUserListItem,
  IAdminRepository,
} from "../../domain/repositories/admin.repository.interface";
import type { AdminOperationError } from "../errors/admin-operation.error";
import { BanAdminUserUseCase } from "../use-cases/ban-admin-user.use-case";

import { createMockAdminRepository } from "./admin-repository.mock";

describe("BanAdminUserUseCase", () => {
  let useCase: BanAdminUserUseCase;
  let mockAdminRepository: IAdminRepository;

  beforeEach(() => {
    mockAdminRepository = createMockAdminRepository();
    useCase = new BanAdminUserUseCase(mockAdminRepository);
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
  });

  it("should reject self-ban", async () => {
    vi.mocked(mockAdminRepository.getUserSecurityState).mockResolvedValue({
      id: "admin-1",
      role: "admin",
      banned: false,
    });

    const result = await useCase.execute({
      actorUserId: "admin-1",
      userId: "admin-1",
    });

    expect(result.isFailure).toBe(true);
    expect((result.error as AdminOperationError).code).toBe(
      "ADMIN_CANNOT_BAN_SELF",
    );
    expect(mockAdminRepository.banUser).not.toHaveBeenCalled();
  });

  it("should reject banning the last active admin", async () => {
    vi.mocked(mockAdminRepository.getUserSecurityState).mockResolvedValue({
      id: "admin-2",
      role: "admin",
      banned: false,
    });
    vi.mocked(mockAdminRepository.countActiveAdmins).mockResolvedValue(1);

    const result = await useCase.execute({
      actorUserId: "admin-1",
      userId: "admin-2",
    });

    expect(result.isFailure).toBe(true);
    expect((result.error as AdminOperationError).code).toBe(
      "ADMIN_LAST_ADMIN",
    );
    expect(mockAdminRepository.banUser).not.toHaveBeenCalled();
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
