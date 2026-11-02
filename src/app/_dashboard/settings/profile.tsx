import { createFileRoute } from "@tanstack/react-router";

import { getPageMetaTags } from "@/lib/seo";
import { getProfileSettingsData } from "@/server-functions/page-data.functions";
import { ProfileSettingsView } from "@/views/settings/profile";

export const Route = createFileRoute("/_dashboard/settings/profile")({
  head: () => ({
    meta: getPageMetaTags("settingsProfile"),
  }),
  loader: async () => getProfileSettingsData(),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, dataExport } = Route.useLoaderData();

  return <ProfileSettingsView user={user} dataExport={dataExport} />;
}
