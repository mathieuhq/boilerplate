import { getTranslations } from "next-intl/server";

import { ErrorTemplate } from "@/components/features/error/error-template";

export async function NotFoundView() {
  const t = await getTranslations("errors");

  return (
    <ErrorTemplate
      code={404}
      title={t("notFoundTitle")}
      description={t("notFoundDescription")}
    />
  );
}
