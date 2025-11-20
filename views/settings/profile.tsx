import { ProfilForm } from "@/components/features/dashboard/form/profile-form";
import { SettingsLayout } from "@/components/features/dashboard/settings/settings-layout";
import type { AuthUser } from "@/types/auth-user";

type ProfileSettingsViewProps = {
  user: AuthUser;
};

export const ProfileSettingsView = ({ user }: ProfileSettingsViewProps) => (
  <SettingsLayout
    title="Profile"
    desc="Update your profile settings and preferences."
  >
    <ProfilForm user={user} />
  </SettingsLayout>
);
