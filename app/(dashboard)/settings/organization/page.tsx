import type { Metadata } from "next";

import { getPageMetadata } from "@/lib/seo";
import { container } from "@/shared/infrastructure/di/container";
import { OrganizationSettingsView } from "@/views/settings/organization";

export const metadata: Metadata = getPageMetadata("settingsOrganization");

export default async function OrganizationPage() {
  const organizationController = container.getOrganizationController();

  const organization =
    await organizationController.getCurrentUserOrganization();

  const [members, invitations] = await Promise.all([
    organizationController.listMembers({
      organizationId: organization.id,
    }),
    organizationController.listInvitations({
      organizationId: organization.id,
    }),
  ]);

  return (
    <OrganizationSettingsView
      members={members}
      invitations={invitations}
      organization={organization}
    />
  );
}
