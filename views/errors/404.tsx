import { ErrorTemplate } from "@/components/features/error/error-template";
import { useTranslations } from "@/i18n";

export function NotFoundView() {
  const t = useTranslations("errors");

  return (
    <ErrorTemplate
      code={404}
      title={t("notFoundTitle")}
      description={t("notFoundDescription")}
    />
  );
}
