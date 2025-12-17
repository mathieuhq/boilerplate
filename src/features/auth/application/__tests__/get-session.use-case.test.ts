import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { createMockAuthProvider } from "@/test/utils/mock-factories";

import { GetSessionUseCase } from "../use-cases/get-session.use-case";

describe("GetSessionUseCase", () => {
  let useCase: GetSessionUseCase;
  let mockAuthProvider: IAuthProviderPort;

  beforeEach(() => {
    mockAuthProvider = createMockAuthProvider();
    useCase = new GetSessionUseCase(mockAuthProvider);
  });

  it("should return session when authenticated", async () => {
    const mockSession = {
      user: {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
      },
      session: {
        id: "session-123",
        userId: "user-123",
        expiresAt: new Date("2025-01-01"),
      },
    };
    vi.mocked(mockAuthProvider.getSession).mockResolvedValue(mockSession);

    const result = await useCase.execute({});

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual(mockSession);
  });

  it("should return null when not authenticated", async () => {
    vi.mocked(mockAuthProvider.getSession).mockResolvedValue(null);

    const result = await useCase.execute({});

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBeNull();
  });

  it("should call auth provider getSession", async () => {
    vi.mocked(mockAuthProvider.getSession).mockResolvedValue(null);

    await useCase.execute({});

    expect(mockAuthProvider.getSession).toHaveBeenCalledTimes(1);
  });
});
