"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button, type ButtonProps } from "@/components/ui/button";

export const ErrorBackButton = ({
  variant = "outline",
  children,
  ...props
}: ButtonProps) => {
  const router = useRouter();

  return (
    <Button variant={variant} onClick={() => router.back()} {...props}>
      {children ?? <TranslatedGoBackLabel />}
    </Button>
  );
};

function TranslatedGoBackLabel() {
  const t = useTranslations("common");

  return t("goBack");
}
