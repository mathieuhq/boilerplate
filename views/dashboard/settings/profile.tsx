import { ProfilForm } from "@/components/features/dashboard/settings/profile-form";
import { SettingsLayout } from "@/components/features/dashboard/settings/settings-layout";

export const ProfileSettingsView = () => (
  <SettingsLayout
    title="Profile"
    desc="Update your profile settings and preferences."
  >
    <ProfilForm />
  </SettingsLayout>
);
