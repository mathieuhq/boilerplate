import { createFileRoute } from "@tanstack/react-router";

import { getPageMetaTags } from "@/lib/seo";
import { getOrganizationSettingsData } from "@/server-functions/page-data.functions";
import { OrganizationSettingsView } from "@/views/settings/organization";

export const Route = createFileRoute("/_dashboard/settings/organization")({
  head: () => ({
    meta: getPageMetaTags("settingsOrganization"),
  }),
  loader: async () => getOrganizationSettingsData(),
  component: OrganizationPage,
});

function OrganizationPage() {
  const { members, invitations, organization } = Route.useLoaderData();

  return (
    <OrganizationSettingsView
      members={members}
      invitations={invitations}
      organization={organization}
    />
  );
}
