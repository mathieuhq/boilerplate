import { userController } from "@/controllers/user.controller";
import { NotificationsSettingsView } from "@/views/settings/notifications";

export default async function NotificationsPage() {
  const user = await userController.getCurrentUserProfile();

  return <NotificationsSettingsView user={user} />;
}
