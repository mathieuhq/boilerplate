import { ProfilForm } from "@/components/features/dashboard/form/profile-form";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type { AuthUser } from "@/types/auth-user";

type ProfileSettingsViewProps = {
  user: AuthUser;
};

export const ProfileSettingsView = ({ user }: ProfileSettingsViewProps) => (
  <PageLayout
    title="Profile"
    desc="Update your profile settings and preferences."
  >
    <ProfilForm user={user} />
  </PageLayout>
);
