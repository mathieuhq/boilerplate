import { ErrorTemplate } from "@/components/features/error/error-template";
import { useTranslations } from "@/i18n";

export function ForbiddenView() {
  const t = useTranslations("errors");

  return (
    <ErrorTemplate
      code={403}
      title={t("forbiddenTitle")}
      description={t("forbiddenDescription")}
    />
  );
}
