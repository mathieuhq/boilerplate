import { createFileRoute } from "@tanstack/react-router";

import { getPageMetaTags } from "@/lib/seo";
import { getNotificationsSettingsData } from "@/server-functions/page-data.functions";
import { NotificationsSettingsView } from "@/views/settings/notifications";

export const Route = createFileRoute("/_dashboard/settings/notifications")({
  head: () => ({
    meta: getPageMetaTags("settingsNotifications"),
  }),
  loader: async () => getNotificationsSettingsData(),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = Route.useLoaderData();

  return <NotificationsSettingsView user={user} />;
}
