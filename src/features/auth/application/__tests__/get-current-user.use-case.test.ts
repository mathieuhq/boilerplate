import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { createMockAuthProvider } from "@/test/utils/mock-factories";

import { GetCurrentUserUseCase } from "../use-cases/get-current-user.use-case";

describe("GetCurrentUserUseCase", () => {
  let useCase: GetCurrentUserUseCase;
  let mockAuthProvider: IAuthProviderPort;

  beforeEach(() => {
    mockAuthProvider = createMockAuthProvider();
    useCase = new GetCurrentUserUseCase(mockAuthProvider);
  });

  it("should return user when authenticated", async () => {
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      role: "user",
    };
    vi.mocked(mockAuthProvider.getUser).mockResolvedValue(mockUser);

    const result = await useCase.execute({});

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual(mockUser);
  });

  it("should return null when not authenticated", async () => {
    vi.mocked(mockAuthProvider.getUser).mockResolvedValue(null);

    const result = await useCase.execute({});

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBeNull();
  });

  it("should call auth provider getUser", async () => {
    vi.mocked(mockAuthProvider.getUser).mockResolvedValue(null);

    await useCase.execute({});

    expect(mockAuthProvider.getUser).toHaveBeenCalledTimes(1);
  });

  it("should return user with optional image", async () => {
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      image: "https://example.com/avatar.png",
    };
    vi.mocked(mockAuthProvider.getUser).mockResolvedValue(mockUser);

    const result = await useCase.execute({});

    expect(result.value?.image).toBe("https://example.com/avatar.png");
  });
});
