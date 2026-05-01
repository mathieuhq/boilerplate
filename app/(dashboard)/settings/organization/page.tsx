import type { Metadata } from "next";

import { getPageMetadata } from "@/lib/seo";
import { container } from "@/shared/infrastructure/di/container";
import { OrganizationSettingsView } from "@/views/settings/organization";

export const metadata: Metadata = getPageMetadata("settingsOrganization");

export default async function OrganizationPage() {
  const organizationController = container.getOrganizationController();
  const organization =
    await organizationController.getCurrentUserOrganization();
  const members = await organizationController.listMembers({
    organizationId: organization.id,
  });
  const invitations = await organizationController.listInvitations({
    organizationId: organization.id,
  });

  return (
    <OrganizationSettingsView
      invitations={invitations}
      organization={organization}
      members={members}
    />
  );
}
