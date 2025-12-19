import { getTranslations } from "next-intl/server";

import { ProfilForm } from "@/components/features/dashboard/form/profile-form";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type { AuthUser } from "@/types/auth-user";

type ProfileSettingsViewProps = {
  user: AuthUser;
};

export async function ProfileSettingsView({ user }: ProfileSettingsViewProps) {
  const t = await getTranslations("settings.profile");

  return (
    <PageLayout title={t("title")} desc={t("description")}>
      <ProfilForm user={user} />
    </PageLayout>
  );
}
