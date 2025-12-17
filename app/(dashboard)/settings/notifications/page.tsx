import { container } from "@/shared/infrastructure/di/container";
import { NotificationsSettingsView } from "@/views/settings/notifications";

export default async function NotificationsPage() {
  const userController = container.getUserController();
  const user = await userController.getCurrentUserProfile();

  return <NotificationsSettingsView user={user} />;
}
