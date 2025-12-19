import { getTranslations } from "next-intl/server";

import { CurrentSubscription } from "@/components/features/dashboard/billing/current-subscription";
import { PlanSelector } from "@/components/features/dashboard/billing/plan-selector";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type { ActiveSubscription } from "@/types/subscription";

type BillingSettingsViewProps = {
  subscription: ActiveSubscription | null;
  userEmail: string;
  zenvoiceUrl?: string;
};

export async function BillingSettingsView({
  userEmail,
  subscription,
  zenvoiceUrl,
}: BillingSettingsViewProps) {
  const t = await getTranslations("settings.billing");

  return (
    <PageLayout title={t("title")} desc={t("description")}>
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
}
