import { ErrorTemplate } from "@/components/features/error/error-template";
import { useTranslations } from "@/i18n";

export function UnauthorizedView() {
  const t = useTranslations("errors");

  return (
    <ErrorTemplate
      code={401}
      title={t("unauthorizedTitle")}
      description={t("unauthorizedDescription")}
    />
  );
}
