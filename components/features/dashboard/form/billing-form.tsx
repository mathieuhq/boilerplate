import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "@/i18n";
import { authClient } from "@/lib/auth-client";

import { LoadingButton } from "../../form/form-button";

const PLANS = ["pro", "team"] as const;

const RETURN_URL = "/settings/billing";

type BillingFormProps = {
  organizationId: string;
};

export const BillingForm = ({ organizationId }: BillingFormProps) => {
  const t = useTranslations("settings.billing");

  const reference = {
    referenceId: organizationId,
    customerType: "organization" as const,
  };

  const { data: subscription, isPending } = useQuery({
    queryKey: ["billing", organizationId],
    queryFn: async () => {
      const response = await authClient.subscription.list({
        query: reference,
      });

      if (response.error) throw new Error(response.error.message);

      return (
        response.data.find(({ status }) =>
          ["active", "trialing", "past_due"].includes(status),
        ) ?? null
      );
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: async (plan: (typeof PLANS)[number]) => {
      const response = await authClient.subscription.upgrade({
        ...reference,
        plan,
        cancelUrl: RETURN_URL,
        successUrl: RETURN_URL,
        subscriptionId: subscription?.stripeSubscriptionId,
      });

      if (response.error) throw new Error(response.error.message);
    },
    onError: (error: Error) => toast.error(error.message || t("upgradeError")),
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await authClient.subscription.billingPortal({
        ...reference,
        returnUrl: RETURN_URL,
      });

      if (response.error) throw new Error(response.error.message);
    },
    onError: (error: Error) => toast.error(error.message || t("portalError")),
  });

  if (isPending) return <Skeleton className="h-32 w-full" />;

  const periodEnd = subscription?.periodEnd
    ? format(new Date(subscription.periodEnd), "PP")
    : null;

  let periodKey: "renewsOn" | "trialEndsOn" | "endsOn" = "renewsOn";
  if (subscription?.status === "trialing") periodKey = "trialEndsOn";
  if (subscription?.cancelAtPeriodEnd) periodKey = "endsOn";

  return (
    <div className="space-y-4">
      <div className="space-y-1 text-sm">
        <p className="font-medium">
          {t("currentPlan", {
            plan: subscription
              ? t(`plans.${subscription.plan}.name`)
              : t("free"),
          })}
        </p>
        {periodEnd ? (
          <p className="text-muted-foreground">
            {t(periodKey, { date: periodEnd })}
          </p>
        ) : null}
      </div>

      <ul className="divide-y rounded-md border">
        {PLANS.map((plan) => (
          <li
            key={plan}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium">{t(`plans.${plan}.name`)}</p>
              <p className="text-xs text-muted-foreground">
                {t(`plans.${plan}.description`)}
              </p>
            </div>
            {subscription?.plan === plan ? (
              <Badge variant="secondary">{t("current")}</Badge>
            ) : (
              <LoadingButton
                size="sm"
                loading={
                  upgradeMutation.isPending &&
                  upgradeMutation.variables === plan
                }
                disabled={upgradeMutation.isPending}
                onClick={() => upgradeMutation.mutate(plan)}
              >
                {t("choose")}
              </LoadingButton>
            )}
          </li>
        ))}
      </ul>

      {subscription ? (
        <LoadingButton
          variant="outline"
          loading={portalMutation.isPending}
          onClick={() => portalMutation.mutate()}
        >
          {t("manage")}
        </LoadingButton>
      ) : null}
    </div>
  );
};
