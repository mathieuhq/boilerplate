import { getTranslations } from "next-intl/server";

import { ErrorTemplate } from "@/components/features/error/error-template";

export async function UnauthorizedView() {
  const t = await getTranslations("errors");

  return (
    <ErrorTemplate
      code={401}
      title={t("unauthorizedTitle")}
      description={t("unauthorizedDescription")}
    />
  );
}
