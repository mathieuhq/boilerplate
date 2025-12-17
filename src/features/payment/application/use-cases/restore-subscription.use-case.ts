import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type {
  IPaymentProviderPort,
  RestoreSubscriptionParams,
} from "../ports/payment-provider.port";

type RestoreSubscriptionOutput = {
  success: boolean;
};

export class RestoreSubscriptionUseCase implements IUseCase<
  RestoreSubscriptionParams,
  RestoreSubscriptionOutput
> {
  constructor(private readonly paymentProvider: IPaymentProviderPort) {}

  async execute(
    input: RestoreSubscriptionParams,
  ): Promise<Result<RestoreSubscriptionOutput>> {
    await this.paymentProvider.restoreSubscription(input);
    return Result.ok({ success: true });
  }
}
