import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { adminOrganizationsPageSchema } from "@/features/admin/interface/schemas/admin.schema";
import { loadListData } from "@/lib/list-loader";
import { getPageMetaTags } from "@/lib/seo";
import { getAdminOrganizationsData } from "@/server-functions/admin.functions";
import { DEFAULT_PAGE_SIZE } from "@/shared/domain/list-query";
import { AdminOrganizationsView } from "@/views/admin/organizations";

export const Route = createFileRoute("/_dashboard/admin/organizations")({
  head: () => ({
    meta: getPageMetaTags("adminOrganizations"),
  }),
  validateSearch: adminOrganizationsPageSchema,
  search: {
    middlewares: [stripSearchParams({ page: 1, pageSize: DEFAULT_PAGE_SIZE })],
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) =>
    loadListData(async () => getAdminOrganizationsData(deps)),
  component: AdminOrganizationsPage,
});

function AdminOrganizationsPage() {
  const query = Route.useSearch();
  const data = Route.useLoaderData();

  return (
    <AdminOrganizationsView
      query={query}
      organizations={data?.organizations ?? null}
      organization={data?.organization ?? null}
    />
  );
}
