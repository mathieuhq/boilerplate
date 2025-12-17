import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuthProviderPort } from "@/features/user/application/ports/auth-provider.port";
import type { IUserRepository } from "@/features/user/domain/repositories/user.repository.interface";
import { buildUser } from "@/test/utils/entity-builders";
import {
  createMockUserAuthProvider,
  createMockUserRepository,
} from "@/test/utils/mock-factories";

import { UserNotFoundError } from "../../domain/errors/user-not-found.error";
import { GetCurrentUserUseCase } from "../use-cases/get-current-user.use-case";

describe("GetCurrentUserUseCase", () => {
  let useCase: GetCurrentUserUseCase;
  let mockUserRepository: IUserRepository;
  let mockAuthProvider: IAuthProviderPort;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockAuthProvider = createMockUserAuthProvider();
    useCase = new GetCurrentUserUseCase(mockUserRepository, mockAuthProvider);
  });

  it("should return current user when found", async () => {
    const user = buildUser();
    vi.mocked(mockAuthProvider.getRequiredUser).mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    });
    vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

    const result = await useCase.execute({});

    expect(result.isSuccess).toBe(true);
    expect(result.value.id).toBe("user-123");
    expect(result.value.email).toBe("test@example.com");
  });

  it("should call auth provider to get required user", async () => {
    const user = buildUser();
    vi.mocked(mockAuthProvider.getRequiredUser).mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    });
    vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

    await useCase.execute({});

    expect(mockAuthProvider.getRequiredUser).toHaveBeenCalledTimes(1);
  });

  it("should return UserNotFoundError when user not in repository", async () => {
    vi.mocked(mockAuthProvider.getRequiredUser).mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    });
    vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

    const result = await useCase.execute({});

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(UserNotFoundError);
  });
});
