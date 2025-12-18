import { NotificationsForm } from "@/components/features/dashboard/form/notifications-form";
import { SettingsLayout } from "@/components/features/dashboard/settings/settings-layout";
import type { UserResponseDTO } from "@/features/user/application/dto/user-response.dto";

type NotificationsSettingsViewProps = {
  user: UserResponseDTO;
};

export const NotificationsSettingsView = ({
  user,
}: NotificationsSettingsViewProps) => (
  <SettingsLayout
    title="Notifications"
    desc="Configure how you receive notifications."
  >
    <NotificationsForm user={user} />
  </SettingsLayout>
);
