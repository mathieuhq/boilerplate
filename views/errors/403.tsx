import { getTranslations } from "next-intl/server";

import { ErrorTemplate } from "@/components/features/error/error-template";

export async function ForbiddenView() {
  const t = await getTranslations("errors");

  return (
    <ErrorTemplate
      code={403}
      title={t("forbiddenTitle")}
      description={t("forbiddenDescription")}
    />
  );
}
