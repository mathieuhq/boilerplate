import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { UserId } from "../../domain/value-objects/user-id.value-object";

type GetUserForEmailInput = {
  userId: string;
};

type GetUserForEmailOutput = {
  email: string;
  name: string | null;
} | null;

export class GetUserForEmailUseCase implements IUseCase<
  GetUserForEmailInput,
  GetUserForEmailOutput
> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(
    input: GetUserForEmailInput,
  ): Promise<Result<GetUserForEmailOutput>> {
    const userId = UserId.create(input.userId);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return Result.ok(null);
    }

    return Result.ok({
      email: user.email.value,
      name: user.name,
    });
  }
}
