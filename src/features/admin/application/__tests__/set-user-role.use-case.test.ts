import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { createMockAuthProvider } from "@/test/utils/mock-factories";

import { ForbiddenActionError } from "../../domain/errors/forbidden-action.error";
import { SetUserRoleUseCase } from "../use-cases/set-user-role.use-case";

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe("SetUserRoleUseCase", () => {
  let useCase: SetUserRoleUseCase;
  let mockAuthProvider: IAuthProviderPort;

  beforeEach(() => {
    mockAuthProvider = createMockAuthProvider();
    useCase = new SetUserRoleUseCase(mockAuthProvider);
  });

  it("should set user role to admin successfully", async () => {
    vi.mocked(mockAuthProvider.setUserRole).mockResolvedValue(undefined);

    const result = await useCase.execute({
      userId: "user-123",
      role: "admin",
      adminUserId: "admin-456",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.success).toBe(true);
  });

  it("should set user role to user successfully", async () => {
    vi.mocked(mockAuthProvider.setUserRole).mockResolvedValue(undefined);

    const result = await useCase.execute({
      userId: "user-123",
      role: "user",
      adminUserId: "admin-456",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.success).toBe(true);
  });

  it("should call provider with correct params", async () => {
    vi.mocked(mockAuthProvider.setUserRole).mockResolvedValue(undefined);

    await useCase.execute({
      userId: "user-123",
      role: "admin",
      adminUserId: "admin-456",
    });

    expect(mockAuthProvider.setUserRole).toHaveBeenCalledWith(
      "user-123",
      "admin",
    );
  });

  it("should prevent admin from changing their own role", async () => {
    const result = await useCase.execute({
      userId: "admin-123",
      role: "user",
      adminUserId: "admin-123",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(ForbiddenActionError);
    expect(result.error.message).toBe("Cannot change your own role");
  });

  it("should not call provider when self-role-change attempted", async () => {
    await useCase.execute({
      userId: "admin-123",
      role: "user",
      adminUserId: "admin-123",
    });

    expect(mockAuthProvider.setUserRole).not.toHaveBeenCalled();
  });
});
