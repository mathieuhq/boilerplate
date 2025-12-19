"use client";

import type { GetBillingPortalUseCase } from "../../application/use-cases/get-billing-portal.use-case";
import type { RestoreSubscriptionUseCase } from "../../application/use-cases/restore-subscription.use-case";
import type { UpgradeSubscriptionUseCase } from "../../application/use-cases/upgrade-subscription.use-case";

export class PaymentController {
  constructor(
    private readonly upgradeSubscriptionUseCase: UpgradeSubscriptionUseCase,
    private readonly restoreSubscriptionUseCase: RestoreSubscriptionUseCase,
    private readonly getBillingPortalUseCase: GetBillingPortalUseCase,
  ) {}

  async upgradeSubscription(params: {
    plan: string;
    seats?: number;
    annual?: boolean;
    cancelUrl: string;
    successUrl: string;
    returnUrl?: string;
    referenceId?: string;
    subscriptionId?: string;
    disableRedirect?: boolean;
    metadata?: Record<string, unknown>;
  }) {
    const result = await this.upgradeSubscriptionUseCase.execute(params);

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async restoreSubscription(params: {
    referenceId?: string;
    subscriptionId: string;
  }) {
    const result = await this.restoreSubscriptionUseCase.execute(params);

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async getBillingPortalUrl(params?: {
    returnUrl?: string;
    referenceId?: string;
  }) {
    const result = await this.getBillingPortalUseCase.execute(params);

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async redirectToBillingPortal(params?: {
    returnUrl?: string;
    referenceId?: string;
  }) {
    const result = await this.getBillingPortalUrl(params);

    if (result.url) window.location.href = result.url;

    return result;
  }
}
