import { createFileRoute } from "@tanstack/react-router";

import { getPageMetaTags } from "@/lib/seo";
import { getUserApiKeysData } from "@/server-functions/api-key.functions";
import { ApiKeysSettingsView } from "@/views/settings/api-keys";

export const Route = createFileRoute("/_dashboard/settings/api-keys")({
  head: () => ({
    meta: getPageMetaTags("settingsApiKeys"),
  }),
  loader: async () => getUserApiKeysData(),
  component: ApiKeysPage,
});

function ApiKeysPage() {
  const { apiKeys, canManage } = Route.useLoaderData();

  return <ApiKeysSettingsView apiKeys={apiKeys} canManage={canManage} />;
}
