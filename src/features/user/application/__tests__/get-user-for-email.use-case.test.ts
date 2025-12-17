import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IUserRepository } from "@/features/user/domain/repositories/user.repository.interface";
import { buildUser } from "@/test/utils/entity-builders";
import { createMockUserRepository } from "@/test/utils/mock-factories";

import { GetUserForEmailUseCase } from "../use-cases/get-user-for-email.use-case";

describe("GetUserForEmailUseCase", () => {
  let useCase: GetUserForEmailUseCase;
  let mockUserRepository: IUserRepository;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    useCase = new GetUserForEmailUseCase(mockUserRepository);
  });

  it("should return user email and name when found", async () => {
    const user = buildUser();
    vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

    const result = await useCase.execute({ userId: "user-123" });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({
      email: "test@example.com",
      name: "Test User",
    });
  });

  it("should return null when user not found", async () => {
    vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

    const result = await useCase.execute({ userId: "non-existent" });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBeNull();
  });

  it("should call repository with correct UserId", async () => {
    vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

    await useCase.execute({ userId: "user-123" });

    expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
    const calledArg = vi.mocked(mockUserRepository.findById).mock.calls[0][0];
    expect(calledArg.value).toBe("user-123");
  });
});
