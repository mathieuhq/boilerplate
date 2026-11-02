import { AuthTemplate } from "@/components/features/auth/auth-template";
import { OAuthConsentForm } from "@/components/features/auth/oauth-consent-form";
import { useTranslations } from "@/i18n";
import { SITE_CONFIG } from "@/lib/site-config";

type OAuthConsentViewProps = {
  scopes: string[];
  clientName: string | null;
  clientUri: string | null;
};

export function OAuthConsentView({
  scopes,
  clientUri,
  clientName,
}: OAuthConsentViewProps) {
  const t = useTranslations("auth");

  const client = clientName ?? t("oauthUnknownClient");

  return (
    <AuthTemplate
      title={t("oauthConsentTitle", { client })}
      description={t("oauthConsentDescription", {
        client,
        app: SITE_CONFIG.TITLE,
      })}
      form={<OAuthConsentForm scopes={scopes} />}
      footer={clientUri ?? undefined}
    />
  );
}
