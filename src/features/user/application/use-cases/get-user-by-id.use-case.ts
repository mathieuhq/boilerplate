import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import { UserNotFoundError } from "../../domain/errors/user-not-found.error";
import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { UserId } from "../../domain/value-objects/user-id.value-object";
import {
  toUserResponseDTO,
  type UserResponseDTO,
} from "../dto/user-response.dto";

type GetUserByIdInput = {
  userId: string;
};

export class GetUserByIdUseCase implements IUseCase<
  GetUserByIdInput,
  UserResponseDTO
> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: GetUserByIdInput): Promise<Result<UserResponseDTO>> {
    const userId = UserId.create(input.userId);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return Result.fail(new UserNotFoundError(input.userId));
    }

    return Result.ok(toUserResponseDTO(user));
  }
}
