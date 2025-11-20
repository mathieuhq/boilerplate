import type Stripe from "stripe";

export type CreateCustomerParams = {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
};

export type CreateCheckoutSessionParams = {
  priceId: string;
  cancelUrl: string;
  successUrl: string;
  customerId: string;
  metadata?: Record<string, string>;
};

export type CreateSubscriptionParams = {
  priceId: string;
  customerId: string;
  metadata?: Record<string, string>;
};

export type CreateBillingPortalSessionParams = {
  returnUrl: string;
  customerId: string;
};

export type PaymentAdapter = {
  createCustomer: (params: CreateCustomerParams) => Promise<Stripe.Customer>;

  getCustomer: (customerId: string) => Promise<Stripe.Customer>;
};
