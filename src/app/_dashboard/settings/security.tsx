import { createFileRoute } from "@tanstack/react-router";

import { getPageMetaTags } from "@/lib/seo";
import { getSecuritySettingsData } from "@/server-functions/page-data.functions";
import { SecuritySettingsView } from "@/views/settings/security";

export const Route = createFileRoute("/_dashboard/settings/security")({
  head: () => ({
    meta: getPageMetaTags("settingsSecurity"),
  }),
  loader: async () => getSecuritySettingsData(),
  component: SecurityPage,
});

function SecurityPage() {
  const { email, twoFactorEnabled, hasPassword } = Route.useLoaderData();

  return (
    <SecuritySettingsView
      email={email}
      twoFactorEnabled={twoFactorEnabled}
      hasPassword={hasPassword}
    />
  );
}
