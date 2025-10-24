import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

import type {
  CreateBillingPortalSessionParams,
  CreateCheckoutSessionParams,
  CreateSubscriptionParams,
  PaymentAdapter,
} from "./adapters/payment-adapter.interface";
import { StripeAdapter } from "./adapters/stripe.adapter";

/**
 * Service layer for payment operations
 */
class PaymentService {
  private readonly paymentAdapter: PaymentAdapter;

  constructor(paymentAdapter: PaymentAdapter) {
    this.paymentAdapter = paymentAdapter;
  }

  /**
   * Gets or creates a Stripe customer for a user
   */
  async getOrCreateCustomer(userId: string, email: string, name?: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user) throw new Error("User not found");

    if (user.stripeCustomerId) {
      try {
        const customer = await this.paymentAdapter.getCustomer(
          user.stripeCustomerId,
        );

        return customer;
      } catch (error) {
        logger.error("[PaymentService] Failed to fetch existing customer", {
          error,
          userId,
          stripeCustomerId: user.stripeCustomerId,
        });
      }
    }

    const customer = await this.paymentAdapter.createCustomer({
      name,
      email,
      metadata: { userId },
    });

    await db.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    logger.info("[PaymentService] Created new customer", {
      userId,
      customerId: customer.id,
    });

    return customer;
  }

  /**
   * Gets the Stripe customer ID for a user
   */
  async getStripeCustomerId(userId: string): Promise<string> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId)
      throw new Error("No stripe customer id found for user");

    return user.stripeCustomerId;
  }
}

export const stripeAdapter = new StripeAdapter(env.STRIPE_SECRET_KEY);

export const paymentService = new PaymentService(stripeAdapter);

export type {
  CreateBillingPortalSessionParams,
  CreateCheckoutSessionParams,
  CreateSubscriptionParams,
};
