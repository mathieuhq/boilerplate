import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type {
  IAuthProviderPort,
  Subscription,
} from "../ports/auth-provider.port";

type GetActiveSubscriptionsInput = Record<string, never>;

export class GetActiveSubscriptionsUseCase implements IUseCase<
  GetActiveSubscriptionsInput,
  Subscription[]
> {
  constructor(private readonly authProvider: IAuthProviderPort) {}

  async execute(
    _input: GetActiveSubscriptionsInput,
  ): Promise<Result<Subscription[]>> {
    const subscriptions = await this.authProvider.getActiveSubscriptions();

    return Result.ok(subscriptions);
  }
}
