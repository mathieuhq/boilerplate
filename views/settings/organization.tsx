import { OrganizationForm } from "@/components/features/dashboard/form/organization-form";
import { OrganizationMembersTable } from "@/components/features/dashboard/organization/organization-members-table";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type { OrganizationInvitationResponseDTO } from "@/features/organization/application/dto/organization-invitation-response.dto";
import type { OrganizationMemberResponseDTO } from "@/features/organization/application/dto/organization-member-response.dto";
import { useTranslations } from "@/i18n";

type Organization = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  logoUrl?: string | null;
};

type OrganizationSettingsViewProps = {
  canInviteMembers: boolean;
  organization: Organization;
  members: OrganizationMemberResponseDTO[];
  invitations: OrganizationInvitationResponseDTO[];
};

export function OrganizationSettingsView({
  members,
  invitations,
  organization,
  canInviteMembers,
}: OrganizationSettingsViewProps) {
  const t = useTranslations("organization");

  return (
    <PageLayout title={t("settings")} desc={t("description")}>
      <div className="space-y-8">
        <OrganizationForm organization={organization} />
        <OrganizationMembersTable
          members={members}
          invitations={invitations}
          canInvite={canInviteMembers}
          organizationId={organization.id}
        />
      </div>
    </PageLayout>
  );
}
