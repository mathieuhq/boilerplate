import { userController } from "@/controllers/user.controller";
import { ProfileSettingsView } from "@/views/settings/profile";

export default async function ProfilePage() {
  const user = await userController.getCurrentUserProfile();

  return <ProfileSettingsView user={user} />;
}
