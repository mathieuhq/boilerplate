import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import { UserNotFoundError } from "../../domain/errors/user-not-found.error";
import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { UserId } from "../../domain/value-objects/user-id.value-object";

type DeleteUserInput = {
  userId: string;
};

type DeleteUserOutput = {
  success: boolean;
  message: string;
};

export class DeleteUserUseCase implements IUseCase<
  DeleteUserInput,
  DeleteUserOutput
> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: DeleteUserInput): Promise<Result<DeleteUserOutput>> {
    const userId = UserId.create(input.userId);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return Result.fail(new UserNotFoundError(input.userId));
    }

    await this.userRepository.delete(userId);

    return Result.ok({
      success: true,
      message: "User deleted successfully",
    });
  }
}
