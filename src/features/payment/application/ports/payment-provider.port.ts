export type UpgradeSubscriptionParams = {
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

export type RestoreSubscriptionParams = {
  referenceId?: string;
  subscriptionId: string;
};

export type BillingPortalParams = {
  returnUrl?: string;
  referenceId?: string;
};

export type UpgradeSubscriptionResult = {
  url?: string;
};

export type BillingPortalResult = {
  url: string;
};

export type IPaymentProviderPort = {
  upgradeSubscription: (
    params: UpgradeSubscriptionParams,
  ) => Promise<UpgradeSubscriptionResult>;
  restoreSubscription: (params: RestoreSubscriptionParams) => Promise<void>;
  getBillingPortalUrl: (
    params?: BillingPortalParams,
  ) => Promise<BillingPortalResult>;
};
