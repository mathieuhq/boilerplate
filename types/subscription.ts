/**
 * Active subscription type returned by Better Auth's listActiveSubscriptions API
 */
export type ActiveSubscription = {
  id: string;
  plan: string;
  priceId?: string;
  status?: string;
  periodStart?: Date;
  periodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  seats?: number;
  trialStart?: Date;
  trialEnd?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  limits?: Record<string, number>;
};
