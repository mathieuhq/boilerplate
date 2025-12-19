"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { PLANS } from "@/lib/plan";
import { getServerUrl } from "@/lib/server-url";
import { useMutation } from "@tanstack/react-query";

import { PlanCard } from "./plan-card";

type PlanSelectorProps = {
  currentPlan?: string;
  subscriptionId?: string;
  cancelAtPeriodEnd?: boolean;
};

export const PlanSelector = ({
  currentPlan,
  subscriptionId,
  cancelAtPeriodEnd,
}: PlanSelectorProps) => {
  const t = useTranslations();
  const BASE_URL = getServerUrl();

  const { mutate: upgradeToPro, isPending: isUpgrading } = useMutation({
    mutationFn: async () => {
      const response = await authClient.subscription.upgrade({
        plan: "pro",
        successUrl: `${BASE_URL}/settings/billing?success=true`,
        cancelUrl: `${BASE_URL}/settings/billing?success=false`,
      });
      if (response.error) throw new Error(response.error.message);
      return response;
    },
    onError: (error: Error) =>
      toast.error(error.message || t("settings.billing.upgradeError")),
  });

  const { mutate: restoreSubscription, isPending: isRestoring } = useMutation({
    mutationFn: async () => {
      if (!subscriptionId) throw new Error("No subscription to restore");

      const response = await authClient.subscription.restore({
        subscriptionId,
      });
      if (response.error) throw new Error(response.error.message);
      return response;
    },
    onSuccess: () => toast.success(t("settings.billing.restoreSuccess")),
    onError: (error: Error) =>
      toast.error(error.message || t("settings.billing.restoreError")),
  });

  const getActionForPlan = (planKey: string) => {
    if (planKey === currentPlan) return undefined;

    if (planKey === "pro")
      return {
        isLoading: isUpgrading,
        label: t("settings.billing.upgradeToPro"),
        action: () => upgradeToPro(),
      };

    if (currentPlan === "pro" && cancelAtPeriodEnd)
      return {
        isLoading: isRestoring,
        label: t("settings.billing.restoreSubscription"),
        action: () => restoreSubscription(),
      };

    return undefined;
  };

  const getPlanPrice = (planKey: string) => {
    const plan = PLANS[planKey as keyof typeof PLANS];

    return plan.pricing.amount;
  };

  const getPlanCurrency = (planKey: string) => {
    const plan = PLANS[planKey as keyof typeof PLANS];

    return plan.pricing.currency;
  };

  return (
    <div className="grid gap-4">
      {Object.entries(PLANS).map(([key, plan]) => {
        const actionConfig = getActionForPlan(key);
        return (
          <PlanCard
            key={key}
            name={plan.name}
            features={plan.features}
            price={getPlanPrice(key)}
            description={plan.description}
            currency={getPlanCurrency(key)}
            onSelect={actionConfig?.action}
            actionLabel={actionConfig?.label}
            isLoading={actionConfig?.isLoading}
            isCurrentPlan={key === currentPlan}
            isHighlighted={"highlighted" in plan && plan.highlighted}
          />
        );
      })}
    </div>
  );
};
