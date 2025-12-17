import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import { UserNotFoundError } from "../../domain/errors/user-not-found.error";
import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { UserId } from "../../domain/value-objects/user-id.value-object";
import {
  toUserResponseDTO,
  type UserResponseDTO,
} from "../dto/user-response.dto";
import type { IAuthProviderPort } from "../ports/auth-provider.port";

type GetCurrentUserInput = Record<string, never>;

export class GetCurrentUserUseCase implements IUseCase<
  GetCurrentUserInput,
  UserResponseDTO
> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authProvider: IAuthProviderPort,
  ) {}

  async execute(_input: GetCurrentUserInput): Promise<Result<UserResponseDTO>> {
    const authUser = await this.authProvider.getRequiredUser();
    const userId = UserId.create(authUser.id);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return Result.fail(new UserNotFoundError(authUser.id));
    }

    return Result.ok(toUserResponseDTO(user));
  }
}
