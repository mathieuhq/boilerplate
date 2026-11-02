import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import { ListAdminUsersUseCase } from "../use-cases/list-admin-users.use-case";

import { createMockAdminRepository } from "./admin-repository.mock";

describe("ListAdminUsersUseCase", () => {
  let useCase: ListAdminUsersUseCase;
  let mockAdminRepository: IAdminRepository;

  beforeEach(() => {
    mockAdminRepository = createMockAdminRepository();
    useCase = new ListAdminUsersUseCase(mockAdminRepository);
  });

  it("should return paginated users with filters", async () => {
    const users = {
      page: 1,
      pageSize: 20,
      total: 1,
      pageCount: 1,
      items: [
        {
          id: "user-1",
          name: "Admin",
          email: "admin@example.com",
          role: "admin" as const,
          banned: false,
          banReason: null,
          banExpires: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          lastLoginAt: null,
          emailVerified: true,
          activeSessionsCount: 1,
        },
      ],
    };
    const input = {
      page: 1,
      pageSize: 20,
      sort: "email.asc" as const,
      search: "admin",
      role: ["admin"],
      banned: false,
      emailVerified: true,
      createdAt: "..2026-01-31",
    };
    vi.mocked(mockAdminRepository.listUsers).mockResolvedValue(users);

    const result = await useCase.execute(input);

    expect(result.isSuccess).toBe(true);
    expect(result.value.users).toEqual(users);
    expect(mockAdminRepository.listUsers).toHaveBeenCalledWith(input);
  });
});
