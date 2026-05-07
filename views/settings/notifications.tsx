import { NotificationsForm } from "@/components/features/dashboard/form/notifications-form";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type { UserResponseDTO } from "@/features/user/application/dto/user-response.dto";
import { useTranslations } from "@/i18n";

type NotificationsSettingsViewProps = {
  user: UserResponseDTO;
};

export function NotificationsSettingsView({
  user,
}: NotificationsSettingsViewProps) {
  const t = useTranslations("settings.notifications");

  return (
    <PageLayout title={t("title")} desc={t("description")}>
      <NotificationsForm user={user} />
    </PageLayout>
  );
}
