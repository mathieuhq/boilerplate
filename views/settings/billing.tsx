"use client";

import { CurrentSubscription } from "@/components/features/dashboard/billing/current-subscription";
import { PlanSelector } from "@/components/features/dashboard/billing/plan-selector";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type { ActiveSubscription } from "@/types/subscription";

type BillingSettingsViewProps = {
  subscription: ActiveSubscription | null;
  userEmail: string;
  zenvoiceUrl?: string;
};

export const BillingSettingsView = ({
  userEmail,
  subscription,
  zenvoiceUrl,
}: BillingSettingsViewProps) => (
  <PageLayout title="Billing" desc="Manage your subscription and billing.">
    <div className="space-y-4">
      <CurrentSubscription
        userEmail={userEmail}
        zenvoiceUrl={zenvoiceUrl}
        subscription={subscription}
      />

      <PlanSelector
        currentPlan={subscription?.plan}
        subscriptionId={subscription?.id}
        cancelAtPeriodEnd={subscription?.cancelAtPeriodEnd ?? false}
      />
    </div>
  </PageLayout>
);
