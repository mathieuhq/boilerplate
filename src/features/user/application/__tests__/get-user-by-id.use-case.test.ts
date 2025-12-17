import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IUserRepository } from "@/features/user/domain/repositories/user.repository.interface";
import { buildUser } from "@/test/utils/entity-builders";
import { createMockUserRepository } from "@/test/utils/mock-factories";

import { UserNotFoundError } from "../../domain/errors/user-not-found.error";
import { GetUserByIdUseCase } from "../use-cases/get-user-by-id.use-case";

describe("GetUserByIdUseCase", () => {
  let useCase: GetUserByIdUseCase;
  let mockUserRepository: IUserRepository;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    useCase = new GetUserByIdUseCase(mockUserRepository);
  });

  it("should return user when found", async () => {
    const user = buildUser();
    vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

    const result = await useCase.execute({ userId: "user-123" });

    expect(result.isSuccess).toBe(true);
    expect(result.value.id).toBe("user-123");
    expect(result.value.email).toBe("test@example.com");
    expect(result.value.name).toBe("Test User");
  });

  it("should return UserNotFoundError when user not found", async () => {
    vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

    const result = await useCase.execute({ userId: "non-existent" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(UserNotFoundError);
  });

  it("should call repository with correct UserId", async () => {
    vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

    await useCase.execute({ userId: "user-123" });

    expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
    const calledArg = vi.mocked(mockUserRepository.findById).mock.calls[0][0];
    expect(calledArg.value).toBe("user-123");
  });
});
