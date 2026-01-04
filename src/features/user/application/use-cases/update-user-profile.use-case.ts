import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";
import { ApplicationError } from "@/shared/domain/errors/application.error";

import { UserNotFoundError } from "../../domain/errors/user-not-found.error";
import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { Email } from "../../domain/value-objects/email.value-object";
import { UserId } from "../../domain/value-objects/user-id.value-object";
import type { UpdateUserProfileDTO } from "../dto/update-user-profile.dto";
import {
  toUserResponseDTO,
  type UserResponseDTO,
} from "../dto/user-response.dto";

export class UpdateUserProfileUseCase implements IUseCase<
  UpdateUserProfileDTO,
  UserResponseDTO
> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: UpdateUserProfileDTO): Promise<Result<UserResponseDTO>> {
    const userId = UserId.create(input.userId);

    const user = await this.userRepository.findById(userId);

    if (!user) return Result.fail(new UserNotFoundError(input.userId));

    if (input.email) {
      const newEmail = Email.create(input.email);

      const emailTaken = await this.userRepository.isEmailTaken(
        newEmail,
        userId,
      );

      if (emailTaken)
        return Result.fail(new ApplicationError("Email is already taken"));
    }

    user.updateProfile({
      name: input.name,
      image: input.image,
      language: input.language,
      birthDate: input.birthDate,
      email: input.email ? Email.create(input.email) : undefined,
    });

    const savedUser = await this.userRepository.save(user);

    return Result.ok(toUserResponseDTO(savedUser));
  }
}
