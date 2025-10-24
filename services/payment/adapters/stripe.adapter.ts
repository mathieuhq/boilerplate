import Stripe from "stripe";
import type {
  CreateCustomerParams,
  PaymentAdapter,
} from "./payment-adapter.interface";

export class StripeAdapter implements PaymentAdapter {
  private stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, {
      typescript: true,
    });
  }

  async createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
    return await this.stripe.customers.create({
      name: params.name,
      email: params.email,
      metadata: params.metadata,
    });
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    return (await this.stripe.customers.retrieve(
      customerId,
    )) as Stripe.Customer;
  }
}
