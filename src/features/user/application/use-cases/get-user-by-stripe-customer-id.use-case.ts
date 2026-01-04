import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type { IUserRepository } from "../../domain/repositories/user.repository.interface";

type GetUserByStripeCustomerIdInput = {
  stripeCustomerId: string;
};

type GetUserByStripeCustomerIdOutput = {
  email: string;
  name: string | null;
} | null;

export class GetUserByStripeCustomerIdUseCase implements IUseCase<
  GetUserByStripeCustomerIdInput,
  GetUserByStripeCustomerIdOutput
> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(
    input: GetUserByStripeCustomerIdInput,
  ): Promise<Result<GetUserByStripeCustomerIdOutput>> {
    const user = await this.userRepository.findByStripeCustomerId(
      input.stripeCustomerId,
    );

    if (!user) return Result.ok(null);

    return Result.ok({
      name: user.name,
      email: user.email.value,
    });
  }
}
