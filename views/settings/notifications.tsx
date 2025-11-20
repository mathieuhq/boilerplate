import { NotificationsForm } from "@/components/features/dashboard/form/notifications-form";
import { SettingsLayout } from "@/components/features/dashboard/settings/settings-layout";
import type { AuthUser } from "@/types/auth-user";

type NotificationsSettingsViewProps = {
  user: AuthUser;
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
