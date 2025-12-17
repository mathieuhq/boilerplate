import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IUserRepository } from "@/features/user/domain/repositories/user.repository.interface";
import { buildUser } from "@/test/utils/entity-builders";
import { createMockUserRepository } from "@/test/utils/mock-factories";

import { UserNotFoundError } from "../../domain/errors/user-not-found.error";
import { DeleteUserUseCase } from "../use-cases/delete-user.use-case";

describe("DeleteUserUseCase", () => {
  let useCase: DeleteUserUseCase;
  let mockUserRepository: IUserRepository;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    useCase = new DeleteUserUseCase(mockUserRepository);
  });

  describe("when user exists", () => {
    it("should delete user successfully", async () => {
      const user = buildUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockUserRepository.delete).mockResolvedValue(undefined);

      const result = await useCase.execute({ userId: "user-123" });

      expect(result.isSuccess).toBe(true);
      expect(result.value.success).toBe(true);
      expect(result.value.message).toBe("User deleted successfully");
    });

    it("should call repository delete with correct userId", async () => {
      const user = buildUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockUserRepository.delete).mockResolvedValue(undefined);

      await useCase.execute({ userId: "user-123" });

      expect(mockUserRepository.delete).toHaveBeenCalledTimes(1);
      const calledArg = vi.mocked(mockUserRepository.delete).mock.calls[0][0];
      expect(calledArg.value).toBe("user-123");
    });
  });

  describe("when user does not exist", () => {
    it("should return UserNotFoundError", async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      const result = await useCase.execute({ userId: "non-existent" });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(UserNotFoundError);
    });

    it("should not call delete when user not found", async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      await useCase.execute({ userId: "non-existent" });

      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });
  });
});
