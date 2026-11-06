import { createFileRoute } from "@tanstack/react-router";

import { getPageMetaTags } from "@/lib/seo";
import { getUserSessionsData } from "@/server-functions/session.functions";
import { SecuritySettingsView } from "@/views/settings/security";

export const Route = createFileRoute("/_dashboard/settings/security")({
  head: () => ({
    meta: getPageMetaTags("settingsSecurity"),
  }),
  loader: async () => getUserSessionsData(),
  component: SecurityPage,
});

function SecurityPage() {
  const sessions = Route.useLoaderData();

  return <SecuritySettingsView sessions={sessions} />;
}
