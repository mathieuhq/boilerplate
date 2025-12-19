import { NotificationsForm } from "@/components/features/dashboard/form/notifications-form";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type { UserResponseDTO } from "@/features/user/application/dto/user-response.dto";

type NotificationsSettingsViewProps = {
  user: UserResponseDTO;
};

export const NotificationsSettingsView = ({
  user,
}: NotificationsSettingsViewProps) => (
  <PageLayout
    title="Notifications"
    desc="Configure how you receive notifications."
  >
    <NotificationsForm user={user} />
  </PageLayout>
);
