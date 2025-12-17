import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { createMockAuthProvider } from "@/test/utils/mock-factories";

import { ForbiddenActionError } from "../../domain/errors/forbidden-action.error";
import { RemoveUserUseCase } from "../use-cases/remove-user.use-case";

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe("RemoveUserUseCase", () => {
  let useCase: RemoveUserUseCase;
  let mockAuthProvider: IAuthProviderPort;

  beforeEach(() => {
    mockAuthProvider = createMockAuthProvider();
    useCase = new RemoveUserUseCase(mockAuthProvider);
  });

  it("should remove user successfully", async () => {
    vi.mocked(mockAuthProvider.removeUser).mockResolvedValue(undefined);

    const result = await useCase.execute({
      userId: "user-to-remove",
      adminUserId: "admin-123",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.success).toBe(true);
  });

  it("should call provider with correct userId", async () => {
    vi.mocked(mockAuthProvider.removeUser).mockResolvedValue(undefined);

    await useCase.execute({
      userId: "user-to-remove",
      adminUserId: "admin-123",
    });

    expect(mockAuthProvider.removeUser).toHaveBeenCalledWith("user-to-remove");
  });

  it("should prevent admin from removing themselves", async () => {
    const result = await useCase.execute({
      userId: "admin-123",
      adminUserId: "admin-123",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(ForbiddenActionError);
    expect(result.error.message).toBe("Cannot remove your own account");
  });

  it("should not call provider when self-removal attempted", async () => {
    await useCase.execute({
      userId: "admin-123",
      adminUserId: "admin-123",
    });

    expect(mockAuthProvider.removeUser).not.toHaveBeenCalled();
  });
});
