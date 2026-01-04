import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type {
  BillingPortalParams,
  BillingPortalResult,
  IPaymentProviderPort,
} from "../ports/payment-provider.port";

export class GetBillingPortalUseCase implements IUseCase<
  BillingPortalParams | undefined,
  BillingPortalResult
> {
  constructor(private readonly paymentProvider: IPaymentProviderPort) {}

  async execute(
    input?: BillingPortalParams,
  ): Promise<Result<BillingPortalResult>> {
    const result = await this.paymentProvider.getBillingPortalUrl(input);

    return Result.ok(result);
  }
}
