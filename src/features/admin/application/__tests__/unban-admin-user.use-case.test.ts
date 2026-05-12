import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  AdminUserListItem,
  IAdminRepository,
} from "../../domain/repositories/admin.repository.interface";
import { UnbanAdminUserUseCase } from "../use-cases/unban-admin-user.use-case";

import { createMockAdminRepository } from "./admin-repository.mock";

describe("UnbanAdminUserUseCase", () => {
  let useCase: UnbanAdminUserUseCase;
  let mockAdminRepository: IAdminRepository;

  beforeEach(() => {
    mockAdminRepository = createMockAdminRepository();
    useCase = new UnbanAdminUserUseCase(mockAdminRepository);
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
