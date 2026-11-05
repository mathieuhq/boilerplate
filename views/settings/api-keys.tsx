import { ApiKeysForm } from "@/components/features/dashboard/form/api-keys-form";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type { ApiKeyListDTO } from "@/features/auth/application/dto/api-key.dto";
import { useTranslations } from "@/i18n";

export function ApiKeysSettingsView({ apiKeys, canManage }: ApiKeyListDTO) {
  const t = useTranslations("settings.apiKeys");

  return (
    <PageLayout title={t("title")} desc={t("description")}>
      <ApiKeysForm apiKeys={apiKeys} canManage={canManage} />
    </PageLayout>
  );
}
