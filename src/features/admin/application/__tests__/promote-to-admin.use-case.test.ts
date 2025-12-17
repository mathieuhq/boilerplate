import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { createMockAuthProvider } from "@/test/utils/mock-factories";

import { PromoteToAdminUseCase } from "../use-cases/promote-to-admin.use-case";

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/lib/env", () => ({
  env: {
    BETTER_AUTH_ADMIN_EMAIL: "admin@example.com",
  },
}));

describe("PromoteToAdminUseCase", () => {
  let useCase: PromoteToAdminUseCase;
  let mockAuthProvider: IAuthProviderPort;

  beforeEach(() => {
    mockAuthProvider = createMockAuthProvider();
    useCase = new PromoteToAdminUseCase(mockAuthProvider);
  });

  it("should promote user when email matches admin email", async () => {
    vi.mocked(mockAuthProvider.setUserRole).mockResolvedValue(undefined);

    const result = await useCase.execute({
      userId: "user-123",
      email: "admin@example.com",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.promoted).toBe(true);
  });

  it("should call setUserRole with admin role", async () => {
    vi.mocked(mockAuthProvider.setUserRole).mockResolvedValue(undefined);

    await useCase.execute({
      userId: "user-123",
      email: "admin@example.com",
    });

    expect(mockAuthProvider.setUserRole).toHaveBeenCalledWith(
      "user-123",
      "admin",
    );
  });

  it("should not promote when email does not match", async () => {
    const result = await useCase.execute({
      userId: "user-123",
      email: "regular@example.com",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.promoted).toBe(false);
  });

  it("should not call setUserRole when email does not match", async () => {
    await useCase.execute({
      userId: "user-123",
      email: "regular@example.com",
    });

    expect(mockAuthProvider.setUserRole).not.toHaveBeenCalled();
  });

  it("should handle case-insensitive email comparison", async () => {
    vi.mocked(mockAuthProvider.setUserRole).mockResolvedValue(undefined);

    const result = await useCase.execute({
      userId: "user-123",
      email: "ADMIN@EXAMPLE.COM",
    });

    expect(result.value.promoted).toBe(true);
  });

  it("should return not promoted when setUserRole throws", async () => {
    vi.mocked(mockAuthProvider.setUserRole).mockRejectedValue(
      new Error("Provider error"),
    );

    const result = await useCase.execute({
      userId: "user-123",
      email: "admin@example.com",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.promoted).toBe(false);
  });
});

describe("PromoteToAdminUseCase without admin email configured", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("should not promote when BETTER_AUTH_ADMIN_EMAIL is not set", async () => {
    vi.doMock("@/lib/env", () => ({
      env: {
        BETTER_AUTH_ADMIN_EMAIL: undefined,
      },
    }));

    const { PromoteToAdminUseCase: UseCaseClass } =
      await import("../use-cases/promote-to-admin.use-case");
    const mockProvider = createMockAuthProvider();
    const useCaseInstance = new UseCaseClass(mockProvider);

    const result = await useCaseInstance.execute({
      userId: "user-123",
      email: "admin@example.com",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.promoted).toBe(false);
  });
});
