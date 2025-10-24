import Stripe from "stripe";

import type {
  CreateCustomerParams,
  PaymentAdapter,
} from "./payment-adapter.interface";

/**
 * Payment adapter using Stripe API
 */
export class StripeAdapter implements PaymentAdapter {
  private readonly stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, {
      typescript: true,
    });
  }

  /**
   * Returns the Stripe client instance
   */
  getStripeInstance(): Stripe {
    return this.stripe;
  }

  /**
   * Creates a Stripe customer
   */
  async createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
    return this.stripe.customers.create({
      name: params.name,
      email: params.email,
      metadata: params.metadata,
    });
  }

  /**
   * Gets a Stripe customer by ID
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    return (await this.stripe.customers.retrieve(
      customerId,
    )) as Stripe.Customer;
  }
}
