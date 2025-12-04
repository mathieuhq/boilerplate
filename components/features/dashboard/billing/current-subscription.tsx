"use client";

import Link from "next/link";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { toast } from "sonner";

import { LoadingButton } from "@/components/features/form/form-button";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PLANS } from "@/lib/plan";
import { getServerUrl } from "@/lib/server-url";
import { paymentClientService } from "@/services/payment/payment.service";
import type { ActiveSubscription } from "@/types/subscription";
import { useMutation } from "@tanstack/react-query";

type CurrentSubscriptionProps = {
  subscription: ActiveSubscription | null;
  userEmail: string;
};

const ZENVOICE_URL = "https://zenvoice.io/p/67d079b7ce427ea4ec3a5867";

export const CurrentSubscription = ({
  subscription,
  userEmail,
}: CurrentSubscriptionProps) => {
  const baseUrl = getServerUrl();

  const { mutate: openBillingPortal, isPending: isOpeningPortal } = useMutation(
    {
      mutationFn: async () => {
        await paymentClientService.redirectToBillingPortal({
          returnUrl: `${baseUrl}/settings/billing`,
        });
      },
      onError: (error: Error) =>
        toast.error(error.message || "Failed to open billing portal"),
    },
  );

  const currentPlan = subscription?.plan ?? "free";
  const planDetails = PLANS[currentPlan as keyof typeof PLANS];

  const invoicesUrl = `${ZENVOICE_URL}?email=${encodeURIComponent(userEmail)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Subscription</CardTitle>
        <CardDescription>
          Your current plan and billing information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <p className="text-muted-foreground">Plan :</p>
            <p className="font-medium">{planDetails.name}</p>
          </div>
          {subscription?.periodEnd && (
            <div className="flex items-center gap-1 text-right">
              <p className="text-muted-foreground">
                {subscription.cancelAtPeriodEnd
                  ? "Access until :"
                  : "Next billing date :"}
              </p>
              <p className="font-medium">
                {format(new Date(subscription.periodEnd), "MMM d, yyyy")}
              </p>
            </div>
          )}
        </div>

        {subscription?.cancelAtPeriodEnd && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            Your subscription will be canceled at the end of the current billing
            period.
          </div>
        )}

        {subscription && subscription.plan !== "free" && (
          <div className="flex gap-2">
            <LoadingButton
              variant="outline"
              className="flex-1"
              loading={isOpeningPortal}
              onClick={() => openBillingPortal()}
            >
              Manage billing
            </LoadingButton>
            <Link
              target="_blank"
              href={invoicesUrl}
              rel="noopener noreferrer"
              className={buttonVariants({
                variant: "outline",
                className: "flex-1",
              })}
            >
              Invoices
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
