import { PasskeysForm } from "@/components/features/dashboard/form/passkeys-form";
import { TwoFactorForm } from "@/components/features/dashboard/form/two-factor-form";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "@/i18n";

type SecuritySettingsViewProps = {
  email: string;
  twoFactorEnabled: boolean;
  hasPassword: boolean;
};

export function SecuritySettingsView({
  email,
  twoFactorEnabled,
  hasPassword,
}: SecuritySettingsViewProps) {
  const t = useTranslations("settings.security");

  return (
    <PageLayout title={t("title")} desc={t("description")}>
      <div className="space-y-8">
        <section className="space-y-4">
          <div>
            <h4 className="font-medium">{t("twoFactor.title")}</h4>
            <p className="text-muted-foreground text-sm">
              {t("twoFactor.description")}
            </p>
          </div>
          <TwoFactorForm
            email={email}
            enabled={twoFactorEnabled}
            hasPassword={hasPassword}
          />
        </section>

        <Separator />

        <section className="space-y-4">
          <div>
            <h4 className="font-medium">{t("passkeys.title")}</h4>
            <p className="text-muted-foreground text-sm">
              {t("passkeys.description")}
            </p>
          </div>
          <PasskeysForm />
        </section>
      </div>
    </PageLayout>
  );
}
