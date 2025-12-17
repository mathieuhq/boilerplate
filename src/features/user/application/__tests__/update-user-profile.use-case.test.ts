import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IUserRepository } from "@/features/user/domain/repositories/user.repository.interface";
import { ApplicationError } from "@/shared/domain/errors/application.error";
import { buildUser } from "@/test/utils/entity-builders";
import { createMockUserRepository } from "@/test/utils/mock-factories";

import { UserNotFoundError } from "../../domain/errors/user-not-found.error";
import { UpdateUserProfileUseCase } from "../use-cases/update-user-profile.use-case";

describe("UpdateUserProfileUseCase", () => {
  let useCase: UpdateUserProfileUseCase;
  let mockUserRepository: IUserRepository;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    useCase = new UpdateUserProfileUseCase(mockUserRepository);
  });

  describe("when user exists", () => {
    it("should update user profile with name", async () => {
      const user = buildUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(user);

      const result = await useCase.execute({
        userId: "user-123",
        name: "Updated Name",
      });

      expect(result.isSuccess).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
    });

    it("should update user profile with email", async () => {
      const user = buildUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockUserRepository.isEmailTaken).mockResolvedValue(false);
      vi.mocked(mockUserRepository.save).mockResolvedValue(user);

      const result = await useCase.execute({
        userId: "user-123",
        email: "new@example.com",
      });

      expect(result.isSuccess).toBe(true);
      expect(mockUserRepository.isEmailTaken).toHaveBeenCalled();
    });

    it("should return error when email is already taken", async () => {
      const user = buildUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockUserRepository.isEmailTaken).mockResolvedValue(true);

      const result = await useCase.execute({
        userId: "user-123",
        email: "taken@example.com",
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error.message).toBe("Email is already taken");
    });

    it("should update multiple fields at once", async () => {
      const user = buildUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(user);

      const result = await useCase.execute({
        userId: "user-123",
        name: "New Name",
        language: "FR",
      });

      expect(result.isSuccess).toBe(true);
    });
  });

  describe("when user does not exist", () => {
    it("should return UserNotFoundError", async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      const result = await useCase.execute({
        userId: "non-existent",
        name: "New Name",
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(UserNotFoundError);
    });
  });
});
