import type Stripe from "stripe";

export interface CreateCustomerParams {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionParams {
  priceId: string;
  cancelUrl: string;
  successUrl: string;
  customerId: string;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionParams {
  priceId: string;
  customerId: string;
  metadata?: Record<string, string>;
}

export interface CreateBillingPortalSessionParams {
  returnUrl: string;
  customerId: string;
}

export interface PaymentAdapter {
  createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer>;

  getCustomer(customerId: string): Promise<Stripe.Customer>;
}
