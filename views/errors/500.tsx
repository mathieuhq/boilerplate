"use client";

import { useTranslations } from "next-intl";

import { ErrorTemplate } from "@/components/features/error/error-template";

export function InternalServerErrorView() {
  const t = useTranslations("errors");

  return (
    <ErrorTemplate
      code={500}
      title={t("serverErrorTitle")}
      description={t("serverErrorDescription")}
    />
  );
}
