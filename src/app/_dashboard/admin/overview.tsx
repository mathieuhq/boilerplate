import { createFileRoute } from "@tanstack/react-router";

import { getPageMetaTags } from "@/lib/seo";
import { getAdminOverviewData } from "@/server-functions/page-data.functions";
import { AdminOverviewView } from "@/views/admin/overview";

export const Route = createFileRoute("/_dashboard/admin/overview")({
  head: () => ({
    meta: getPageMetaTags("adminOverview"),
  }),
  loader: async () => getAdminOverviewData(),
  component: AdminOverviewPage,
});

function AdminOverviewPage() {
  const { stats } = Route.useLoaderData();

  return <AdminOverviewView stats={stats} />;
}
