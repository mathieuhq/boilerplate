import { getTranslations } from "next-intl/server";

import { NotificationsForm } from "@/components/features/dashboard/form/notifications-form";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type { UserResponseDTO } from "@/features/user/application/dto/user-response.dto";

type NotificationsSettingsViewProps = {
  user: UserResponseDTO;
};

export async function NotificationsSettingsView({
  user,
}: NotificationsSettingsViewProps) {
  const t = await getTranslations("settings.notifications");

  return (
    <PageLayout title={t("title")} desc={t("description")}>
      <NotificationsForm user={user} />
    </PageLayout>
  );
}
