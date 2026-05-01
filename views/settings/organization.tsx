import { getTranslations } from "next-intl/server";

import { OrganizationForm } from "@/components/features/dashboard/form/organization-form";
import { OrganizationMembersTable } from "@/components/features/dashboard/organization/organization-members-table";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type { OrganizationInvitationResponseDTO } from "@/features/organization/application/dto/organization-invitation-response.dto";
import type { OrganizationMemberResponseDTO } from "@/features/organization/application/dto/organization-member-response.dto";

type Organization = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
};

type OrganizationSettingsViewProps = {
  organization: Organization;
  members: OrganizationMemberResponseDTO[];
  invitations: OrganizationInvitationResponseDTO[];
};

export async function OrganizationSettingsView({
  members,
  invitations,
  organization,
}: OrganizationSettingsViewProps) {
  const t = await getTranslations("organization");

  return (
    <PageLayout title={t("settings")} desc={t("description")}>
      <div className="space-y-8">
        <OrganizationForm organization={organization} />
        <OrganizationMembersTable
          invitations={invitations}
          members={members}
          organizationId={organization.id}
        />
      </div>
    </PageLayout>
  );
}
