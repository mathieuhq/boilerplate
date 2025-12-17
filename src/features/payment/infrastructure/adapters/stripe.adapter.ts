"use client";

import { authClient } from "@/lib/auth-client";
import { ApplicationError } from "@/shared/domain/errors/application.error";

import type {
  BillingPortalParams,
  BillingPortalResult,
  IPaymentProviderPort,
  RestoreSubscriptionParams,
  UpgradeSubscriptionParams,
  UpgradeSubscriptionResult,
} from "../../application/ports/payment-provider.port";

export class StripeAdapter implements IPaymentProviderPort {
  async upgradeSubscription(
    params: UpgradeSubscriptionParams,
  ): Promise<UpgradeSubscriptionResult> {
    const response = await authClient.subscription.upgrade({
      plan: params.plan,
      seats: params.seats,
      annual: params.annual,
      metadata: params.metadata,
      returnUrl: params.returnUrl,
      cancelUrl: params.cancelUrl,
      successUrl: params.successUrl,
      referenceId: params.referenceId,
      subscriptionId: params.subscriptionId,
      disableRedirect: params.disableRedirect,
    });

    if (response.error) {
      throw new ApplicationError(
        response.error.message ?? "Failed to upgrade subscription",
      );
    }

    return { url: response.data.url };
  }

  async restoreSubscription(params: RestoreSubscriptionParams): Promise<void> {
    const response = await authClient.subscription.restore({
      referenceId: params.referenceId,
      subscriptionId: params.subscriptionId,
    });

    if (response.error) {
      throw new ApplicationError(
        response.error.message ?? "Failed to restore subscription",
      );
    }
  }

  async getBillingPortalUrl(
    params?: BillingPortalParams,
  ): Promise<BillingPortalResult> {
    const response = await authClient.subscription.billingPortal({
      returnUrl: params?.returnUrl,
      referenceId: params?.referenceId,
    });

    if (response.error) {
      throw new ApplicationError(
        response.error.message ?? "Failed to get billing portal URL",
      );
    }

    return { url: response.data.url };
  }
}
