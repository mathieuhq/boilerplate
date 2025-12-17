import { container } from "@/shared/infrastructure/di/container";
import { ProfileSettingsView } from "@/views/settings/profile";

export default async function ProfilePage() {
  const userController = container.getUserController();
  const user = await userController.getCurrentUserProfile();

  return <ProfileSettingsView user={user} />;
}
