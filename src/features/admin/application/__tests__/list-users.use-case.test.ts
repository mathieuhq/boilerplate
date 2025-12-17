import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { createMockAuthProvider } from "@/test/utils/mock-factories";

import { ListUsersUseCase } from "../use-cases/list-users.use-case";

describe("ListUsersUseCase", () => {
  let useCase: ListUsersUseCase;
  let mockAuthProvider: IAuthProviderPort;

  beforeEach(() => {
    mockAuthProvider = createMockAuthProvider();
    useCase = new ListUsersUseCase(mockAuthProvider);
  });

  it("should return list of users", async () => {
    vi.mocked(mockAuthProvider.listUsers).mockResolvedValue({
      users: [
        {
          id: "user-1",
          role: "user",
          name: "User One",
          email: "user1@example.com",
        },
        {
          id: "user-2",
          role: "admin",
          name: "User Two",
          email: "user2@example.com",
        },
      ],
      total: 2,
    });

    const result = await useCase.execute({});

    expect(result.isSuccess).toBe(true);
    expect(result.value.users).toHaveLength(2);
    expect(result.value.total).toBe(2);
  });

  it("should pass pagination params to provider", async () => {
    vi.mocked(mockAuthProvider.listUsers).mockResolvedValue({
      users: [],
      total: 0,
    });

    await useCase.execute({
      limit: 10,
      offset: 20,
    });

    expect(mockAuthProvider.listUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 10,
        offset: 20,
      }),
    );
  });

  it("should pass search params to provider", async () => {
    vi.mocked(mockAuthProvider.listUsers).mockResolvedValue({
      users: [],
      total: 0,
    });

    await useCase.execute({
      searchValue: "john",
      searchField: "name",
    });

    expect(mockAuthProvider.listUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        searchValue: "john",
        searchField: "name",
      }),
    );
  });

  it("should pass sort params to provider", async () => {
    vi.mocked(mockAuthProvider.listUsers).mockResolvedValue({
      users: [],
      total: 0,
    });

    await useCase.execute({
      sortBy: "email",
      sortDirection: "asc",
    });

    expect(mockAuthProvider.listUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: "email",
        sortDirection: "asc",
      }),
    );
  });

  it("should map user properties correctly", async () => {
    vi.mocked(mockAuthProvider.listUsers).mockResolvedValue({
      users: [
        {
          id: "user-1",
          role: "admin",
          name: "User One",
          email: "user1@example.com",
          image: "https://example.com/avatar.png",
        },
      ],
      total: 1,
    });

    const result = await useCase.execute({});

    expect(result.value.users[0]).toEqual({
      id: "user-1",
      role: "admin",
      name: "User One",
      email: "user1@example.com",
      image: "https://example.com/avatar.png",
    });
  });
});
