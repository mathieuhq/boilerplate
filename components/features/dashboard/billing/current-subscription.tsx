"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { toast } from "sonner";

import { LoadingButton } from "@/components/features/form/form-button";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { PLANS } from "@/lib/plan";
import { getServerUrl } from "@/lib/server-url";
import type { ActiveSubscription } from "@/types/subscription";
import { useMutation } from "@tanstack/react-query";

type CurrentSubscriptionProps = {
  userEmail: string;
  zenvoiceUrl?: string;
  subscription: ActiveSubscription | null;
};

export const CurrentSubscription = ({
  userEmail,
  zenvoiceUrl,
  subscription,
}: CurrentSubscriptionProps) => {
  const t = useTranslations();
  const BASE_URL = getServerUrl();

  const { mutate: openBillingPortal, isPending: isOpeningPortal } = useMutation(
    {
      mutationFn: async () => {
        const response = await authClient.subscription.billingPortal({
          returnUrl: `${BASE_URL}/settings/billing`,
        });
        if (response.error) throw new Error(response.error.message);
        if (response.data.url) window.location.href = response.data.url;
        return response;
      },
      onError: (error: Error) =>
        toast.error(error.message || t("settings.billing.upgradeError")),
    },
  );

  const currentPlan = subscription?.plan;

  if (!currentPlan) return null;

  const planDetails = PLANS[currentPlan as keyof typeof PLANS];

  const invoicesUrl = zenvoiceUrl
    ? `${zenvoiceUrl}?email=${encodeURIComponent(userEmail)}`
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.billing.currentSubscription")}</CardTitle>
        <CardDescription>
          {t("settings.billing.currentSubscriptionDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <p className="text-muted-foreground">
              {t("settings.billing.plan")} :
            </p>
            <p className="font-medium">{t(planDetails.nameKey)}</p>
          </div>
          {subscription.periodEnd && (
            <div className="flex items-center gap-1 text-right">
              <p className="text-muted-foreground">
                {subscription.cancelAtPeriodEnd
                  ? t("settings.billing.accessUntil")
                  : t("settings.billing.nextBillingDate")}
                :
              </p>
              <p className="font-medium">
                {format(new Date(subscription.periodEnd), "MMM d, yyyy")}
              </p>
            </div>
          )}
        </div>

        {subscription.cancelAtPeriodEnd && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {t("settings.billing.cancelNotice")}
          </div>
        )}

        <div className="flex gap-2">
          <LoadingButton
            variant="outline"
            className="flex-1"
            loading={isOpeningPortal}
            onClick={() => openBillingPortal()}
          >
            {t("settings.billing.manageBilling")}
          </LoadingButton>
          {invoicesUrl && (
            <Link
              target="_blank"
              href={invoicesUrl}
              rel="noopener noreferrer"
              className={buttonVariants({
                variant: "outline",
                className: "flex-1",
              })}
            >
              {t("settings.billing.invoices")}
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
