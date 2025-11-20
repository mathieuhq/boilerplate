import { ApplicationError } from "@/lib/errors/application-error";
import { authService } from "@/services/auth/auth.service";
import { userService } from "@/services/user/user.service";
import { ProfileSettingsView } from "@/views/settings/profile";

export default async function ProfilePage() {
  const currentUser = await authService.getRequiredUser();
  const user = await userService.getUserById(currentUser.id);

  if (!user) throw new ApplicationError("User not found");

  return <ProfileSettingsView user={user} />;
}
