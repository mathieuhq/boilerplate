import { ErrorTemplate } from "@/components/features/error/error-template";
import { useTranslations } from "@/i18n";

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
