import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { listAdminUsersSchema } from "@/features/admin/interface/schemas/admin.schema";
import { loadListData } from "@/lib/list-loader";
import { getPageMetaTags } from "@/lib/seo";
import { getAdminUsersData } from "@/server-functions/admin.functions";
import { DEFAULT_PAGE_SIZE } from "@/shared/domain/list-query";
import { AdminUsersView } from "@/views/admin/users";

export const Route = createFileRoute("/_dashboard/admin/users")({
  head: () => ({
    meta: getPageMetaTags("adminUsers"),
  }),
  validateSearch: listAdminUsersSchema,
  search: {
    middlewares: [stripSearchParams({ page: 1, pageSize: DEFAULT_PAGE_SIZE })],
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => loadListData(async () => getAdminUsersData(deps)),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const query = Route.useSearch();
  const data = Route.useLoaderData();
  const { access } = Route.useRouteContext();

  return (
    <AdminUsersView
      query={query}
      access={access}
      users={data?.users ?? null}
      roles={data?.roles ?? []}
    />
  );
}
