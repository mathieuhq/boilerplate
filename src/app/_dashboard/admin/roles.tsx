import { createFileRoute } from "@tanstack/react-router";

import { getPageMetaTags } from "@/lib/seo";
import { getAdminRolesData } from "@/server-functions/admin.functions";
import { AdminRolesView } from "@/views/admin/roles";

export const Route = createFileRoute("/_dashboard/admin/roles")({
  head: () => ({
    meta: getPageMetaTags("adminRoles"),
  }),
  loader: async () => getAdminRolesData(),
  component: AdminRolesPage,
});

function AdminRolesPage() {
  const roles = Route.useLoaderData();
  const { access } = Route.useRouteContext();

  return <AdminRolesView roles={roles} access={access} />;
}
