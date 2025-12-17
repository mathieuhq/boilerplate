import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type {
  IPaymentProviderPort,
  UpgradeSubscriptionParams,
  UpgradeSubscriptionResult,
} from "../ports/payment-provider.port";

export class UpgradeSubscriptionUseCase implements IUseCase<
  UpgradeSubscriptionParams,
  UpgradeSubscriptionResult
> {
  constructor(private readonly paymentProvider: IPaymentProviderPort) {}

  async execute(
    input: UpgradeSubscriptionParams,
  ): Promise<Result<UpgradeSubscriptionResult>> {
    const result = await this.paymentProvider.upgradeSubscription(input);
    return Result.ok(result);
  }
}
