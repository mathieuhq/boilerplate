import { PasskeysForm } from "@/components/features/dashboard/form/passkeys-form";
import { SessionsForm } from "@/components/features/dashboard/form/sessions-form";
import { TwoFactorForm } from "@/components/features/dashboard/form/two-factor-form";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import { Separator } from "@/components/ui/separator";
import type { UserSessionListDTO } from "@/features/auth/application/dto/user-session.dto";
import { useTranslations } from "@/i18n";

type SecuritySettingsViewProps = {
  email: string;
  twoFactorEnabled: boolean;
  hasPassword: boolean;
  sessions: UserSessionListDTO;
};

export function SecuritySettingsView({
  email,
  twoFactorEnabled,
  hasPassword,
  sessions,
}: SecuritySettingsViewProps) {
  const t = useTranslations("settings.security");

  return (
    <PageLayout title={t("title")} desc={t("description")}>
      <div className="space-y-8">
        <section className="space-y-4">
          <div>
            <h4 className="font-medium">{t("twoFactor.title")}</h4>
            <p className="text-sm text-muted-foreground">
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
            <p className="text-sm text-muted-foreground">
              {t("passkeys.description")}
            </p>
          </div>
          <PasskeysForm />
        </section>

        <Separator />

        <section className="space-y-4">
          <div>
            <h4 className="font-medium">{t("sessions.title")}</h4>
            <p className="text-sm text-muted-foreground">
              {t("sessions.description")}
            </p>
          </div>
          <SessionsForm
            sessions={sessions.sessions}
            canManage={sessions.canManage}
          />
        </section>
      </div>
    </PageLayout>
  );
}
