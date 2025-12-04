"use client";

import { Check, X } from "lucide-react";

import { LoadingButton } from "@/components/features/form/form-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatPrice } from "@/lib/utils";

type Feature = {
  name: string;
  included: boolean;
};

type PlanCardProps = {
  name: string;
  price: number;
  currency: string;
  disabled?: boolean;
  description: string;
  isLoading?: boolean;
  actionLabel?: string;
  onSelect?: () => void;
  isCurrentPlan: boolean;
  isHighlighted?: boolean;
  features: readonly Feature[];
};

export const PlanCard = ({
  name,
  price,
  disabled,
  currency,
  features,
  onSelect,
  isLoading,
  actionLabel,
  description,
  isCurrentPlan,
  isHighlighted,
}: PlanCardProps) => (
  <Card
    className={cn(
      "relative flex flex-col",
      isCurrentPlan && "bg-muted/50",
      isHighlighted && "border-primary shadow-md",
    )}
  >
    {isHighlighted && !isCurrentPlan && (
      <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">
        Recommended
      </Badge>
    )}
    {isCurrentPlan && (
      <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">
        Current plan
      </Badge>
    )}
    <CardHeader>
      <CardTitle>{name}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="flex-1">
      <div className="mb-6">
        <span className="text-4xl font-bold">
          {formatPrice(price, currency)}
        </span>
        {price > 0 && <span className="text-muted-foreground">/month</span>}
      </div>
      <ul className="space-y-3">
        {features.map((feature) => (
          <li key={feature.name} className="flex items-center gap-2">
            {feature.included ? (
              <Check className="size-4 shrink-0 text-green-500" />
            ) : (
              <X className="text-muted-foreground size-4 shrink-0" />
            )}
            <span
              className={cn(
                "text-sm",
                !feature.included && "text-muted-foreground",
              )}
            >
              {feature.name}
            </span>
          </li>
        ))}
      </ul>
    </CardContent>
    <CardFooter>
      <LoadingButton
        className="w-full"
        onClick={onSelect}
        loading={isLoading}
        variant={isHighlighted ? "default" : "outline"}
        disabled={Boolean(disabled) || isCurrentPlan || Boolean(isLoading)}
      >
        {isCurrentPlan ? "Current plan" : actionLabel}
      </LoadingButton>
    </CardFooter>
  </Card>
);
