"use client";

import { authClient } from "@/lib/auth-client";
import { ApplicationError } from "@/lib/errors/application-error";

type UpgradeSubscriptionOptions = {
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
};

type RestoreSubscriptionOptions = {
  referenceId?: string;
  subscriptionId: string;
};

type BillingPortalOptions = {
  returnUrl?: string;
  referenceId?: string;
};

/**
 * Client-side payment service for subscription management via BetterAuth Stripe plugin
 */
class PaymentClientService {
  /**
   * Create or upgrade a subscription to a specified plan
   */
  async upgradeSubscription(options: UpgradeSubscriptionOptions) {
    const response = await authClient.subscription.upgrade({
      plan: options.plan,
      seats: options.seats,
      annual: options.annual,
      metadata: options.metadata,
      returnUrl: options.returnUrl,
      cancelUrl: options.cancelUrl,
      successUrl: options.successUrl,
      referenceId: options.referenceId,
      subscriptionId: options.subscriptionId,
      disableRedirect: options.disableRedirect,
    });

    if (response.error)
      throw new ApplicationError(
        response.error.message ?? "Failed to upgrade subscription",
      );

    return response;
  }

  /**
   * Restore a subscription that was previously set to cancel at the end of the billing period
   */
  async restoreSubscription(options: RestoreSubscriptionOptions) {
    const response = await authClient.subscription.restore({
      referenceId: options.referenceId,
      subscriptionId: options.subscriptionId,
    });

    if (response.error)
      throw new ApplicationError(
        response.error.message ?? "Failed to restore subscription",
      );

    return response;
  }

  /**
   * Get the Stripe billing portal URL where customers can manage their subscriptions
   */
  async getBillingPortalUrl(options?: BillingPortalOptions) {
    const response = await authClient.subscription.billingPortal({
      returnUrl: options?.returnUrl,
      referenceId: options?.referenceId,
    });

    if (response.error)
      throw new ApplicationError(
        response.error.message ?? "Failed to get billing portal URL",
      );

    return response;
  }

  /**
   * Redirect to the Stripe billing portal
   */
  async redirectToBillingPortal(options?: BillingPortalOptions) {
    const response = await this.getBillingPortalUrl(options);

    if (response.data.url) window.location.href = response.data.url;

    return response;
  }
}

export const paymentClientService = new PaymentClientService();
