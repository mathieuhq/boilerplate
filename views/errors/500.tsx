import { getTranslations } from "next-intl/server";

import { ErrorTemplate } from "@/components/features/error/error-template";

export async function InternalServerErrorView() {
  const t = await getTranslations("errors");

  return (
    <ErrorTemplate
      code={500}
      title={t("serverErrorTitle")}
      description={t("serverErrorDescription")}
    />
  );
}
