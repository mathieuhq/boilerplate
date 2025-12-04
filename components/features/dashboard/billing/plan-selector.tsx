"use client";

import { toast } from "sonner";

import { PLANS } from "@/lib/plan";
import { getServerUrl } from "@/lib/server-url";
import { paymentClientService } from "@/services/payment/payment.service";
import { useMutation } from "@tanstack/react-query";

import { PlanCard } from "./plan-card";

type PlanSelectorProps = {
  currentPlan: string;
  subscriptionId?: string;
  cancelAtPeriodEnd?: boolean;
};

export const PlanSelector = ({
  currentPlan,
  subscriptionId,
  cancelAtPeriodEnd,
}: PlanSelectorProps) => {
  const baseUrl = getServerUrl();

  const { mutate: upgradeToPro, isPending: isUpgrading } = useMutation({
    mutationFn: async () => {
      await paymentClientService.upgradeSubscription({
        plan: "pro",
        successUrl: `${baseUrl}/settings/billing?success=true`,
        cancelUrl: `${baseUrl}/settings/billing?success=false`,
      });
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to upgrade subscription"),
  });

  const { mutate: cancelSubscription, isPending: isCanceling } = useMutation({
    mutationFn: async () => {
      await paymentClientService.cancelSubscription({
        returnUrl: `${baseUrl}/settings/billing`,
        subscriptionId,
      });
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to cancel subscription"),
  });

  const { mutate: restoreSubscription, isPending: isRestoring } = useMutation({
    mutationFn: async () => {
      if (!subscriptionId) throw new Error("No subscription to restore");

      await paymentClientService.restoreSubscription({
        subscriptionId,
      });
    },
    onSuccess: () => toast.success("Subscription restored successfully"),
    onError: (error: Error) =>
      toast.error(error.message || "Failed to restore subscription"),
  });

  const getActionForPlan = (planKey: string) => {
    if (planKey === currentPlan) return undefined;

    if (planKey === "pro" && currentPlan === "free") {
      return {
        isLoading: isUpgrading,
        label: "Upgrade to Pro",
        action: () => upgradeToPro(),
      };
    }

    if (planKey === "free" && currentPlan === "pro") {
      if (cancelAtPeriodEnd) {
        return {
          isLoading: isRestoring,
          label: "Restore subscription",
          action: () => restoreSubscription(),
        };
      }
      return {
        isLoading: isCanceling,
        label: "Downgrade to Free",
        action: () => cancelSubscription(),
      };
    }

    return undefined;
  };

  const getPlanPrice = (planKey: string) => {
    const plan = PLANS[planKey as keyof typeof PLANS];
    if ("monthly" in plan.pricing) {
      return plan.pricing.amount;
    }
    return plan.pricing.amount;
  };

  const getPlanCurrency = (planKey: string) => {
    const plan = PLANS[planKey as keyof typeof PLANS];
    if ("monthly" in plan.pricing) {
      return plan.pricing.currency;
    }
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
