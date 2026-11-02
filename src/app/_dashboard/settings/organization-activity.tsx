import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { listOrganizationAuditLogsSchema } from "@/features/organization/interface/schemas/organization.schema";
import { loadListData } from "@/lib/list-loader";
import { getPageMetaTags } from "@/lib/seo";
import { getOrganizationActivityData } from "@/server-functions/organization-activity.functions";
import { DEFAULT_PAGE_SIZE } from "@/shared/domain/list-query";
import { OrganizationActivityView } from "@/views/settings/organization-activity";

export const Route = createFileRoute(
  "/_dashboard/settings/organization-activity",
)({
  head: () => ({
    meta: getPageMetaTags("settingsOrganizationActivity"),
  }),
  validateSearch: listOrganizationAuditLogsSchema,
  search: {
    middlewares: [stripSearchParams({ page: 1, pageSize: DEFAULT_PAGE_SIZE })],
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) =>
    loadListData(async () => getOrganizationActivityData({ data: deps })),
  component: OrganizationActivityPage,
});

function OrganizationActivityPage() {
  const query = Route.useSearch();
  const data = Route.useLoaderData();

  return (
    <OrganizationActivityView
      query={query}
      organization={data?.organization ?? null}
      auditLogs={data?.auditLogs ?? null}
    />
  );
}
