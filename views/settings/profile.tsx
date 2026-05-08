import { ProfilForm } from "@/components/features/dashboard/form/profile-form";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import { useTranslations } from "@/i18n";
import type { AuthUser } from "@/types/auth-user";

type ProfileSettingsViewProps = {
  user: AuthUser;
};

export function ProfileSettingsView({ user }: ProfileSettingsViewProps) {
  const t = useTranslations("settings.profile");

  return (
    <PageLayout title={t("title")} desc={t("description")}>
      <ProfilForm user={user} />
    </PageLayout>
  );
}
