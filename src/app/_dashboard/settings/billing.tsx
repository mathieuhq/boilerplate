import { createFileRoute } from "@tanstack/react-router";

import { getPageMetaTags } from "@/lib/seo";
import { getBillingSettingsData } from "@/server-functions/page-data.functions";
import { BillingSettingsView } from "@/views/settings/billing";

export const Route = createFileRoute("/_dashboard/settings/billing")({
  head: () => ({
    meta: getPageMetaTags("settingsBilling"),
  }),
  loader: async () => getBillingSettingsData(),
  component: BillingPage,
});

function BillingPage() {
  const { organizationId } = Route.useLoaderData();

  return <BillingSettingsView organizationId={organizationId} />;
}
