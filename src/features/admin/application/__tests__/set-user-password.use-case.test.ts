import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { createMockAuthProvider } from "@/test/utils/mock-factories";

import { SetUserPasswordUseCase } from "../use-cases/set-user-password.use-case";

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe("SetUserPasswordUseCase", () => {
  let useCase: SetUserPasswordUseCase;
  let mockAuthProvider: IAuthProviderPort;

  beforeEach(() => {
    mockAuthProvider = createMockAuthProvider();
    useCase = new SetUserPasswordUseCase(mockAuthProvider);
  });

  it("should set user password successfully", async () => {
    vi.mocked(mockAuthProvider.setUserPassword).mockResolvedValue(undefined);

    const result = await useCase.execute({
      userId: "user-123",
      newPassword: "newSecurePassword123",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.success).toBe(true);
  });

  it("should call provider with correct params", async () => {
    vi.mocked(mockAuthProvider.setUserPassword).mockResolvedValue(undefined);

    await useCase.execute({
      userId: "user-123",
      newPassword: "newSecurePassword123",
    });

    expect(mockAuthProvider.setUserPassword).toHaveBeenCalledWith(
      "user-123",
      "newSecurePassword123",
    );
  });

  it("should call setUserPassword once", async () => {
    vi.mocked(mockAuthProvider.setUserPassword).mockResolvedValue(undefined);

    await useCase.execute({
      userId: "user-123",
      newPassword: "newPassword",
    });

    expect(mockAuthProvider.setUserPassword).toHaveBeenCalledTimes(1);
  });
});
