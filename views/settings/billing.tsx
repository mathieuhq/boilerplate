"use client";

import { CurrentSubscription } from "@/components/features/dashboard/billing/current-subscription";
import { PlanSelector } from "@/components/features/dashboard/billing/plan-selector";
import { SettingsLayout } from "@/components/features/dashboard/settings/settings-layout";
import type { ActiveSubscription } from "@/types/subscription";

type BillingSettingsViewProps = {
  subscription: ActiveSubscription | null;
  userEmail: string;
};

export const BillingSettingsView = ({
  userEmail,
  subscription,
}: BillingSettingsViewProps) => (
  <SettingsLayout title="Billing" desc="Manage your subscription and billing.">
    <div className="space-y-4">
      <CurrentSubscription subscription={subscription} userEmail={userEmail} />

      <PlanSelector
        currentPlan={subscription?.plan}
        subscriptionId={subscription?.id}
        cancelAtPeriodEnd={subscription?.cancelAtPeriodEnd ?? false}
      />
    </div>
  </SettingsLayout>
);
