/**
 * Active subscription type returned by Better Auth's listActiveSubscriptions API
 */
export type ActiveSubscription = {
  id: string;
  plan: string;
  seats?: number;
  status?: string;
  trialEnd?: Date;
  priceId?: string;
  periodEnd?: Date;
  trialStart?: Date;
  periodStart?: Date;
  stripeCustomerId?: string;
  cancelAtPeriodEnd?: boolean;
  stripeSubscriptionId?: string;
  limits?: Record<string, unknown>;
};
