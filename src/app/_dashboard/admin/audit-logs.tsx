import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { listAdminAuditLogsSchema } from "@/features/admin/interface/schemas/admin.schema";
import { loadListData } from "@/lib/list-loader";
import { getPageMetaTags } from "@/lib/seo";
import { getAdminAuditLogsData } from "@/server-functions/admin.functions";
import { DEFAULT_PAGE_SIZE } from "@/shared/domain/list-query";
import { AdminAuditLogsView } from "@/views/admin/audit-logs";

const EMPTY_FACETS = { actions: [], actorTypes: [], resourceTypes: [] };

export const Route = createFileRoute("/_dashboard/admin/audit-logs")({
  head: () => ({
    meta: getPageMetaTags("adminAuditLogs"),
  }),
  validateSearch: listAdminAuditLogsSchema,
  search: {
    middlewares: [stripSearchParams({ page: 1, pageSize: DEFAULT_PAGE_SIZE })],
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) =>
    loadListData(async () => getAdminAuditLogsData(deps)),
  component: AdminAuditLogsPage,
});

function AdminAuditLogsPage() {
  const query = Route.useSearch();
  const data = Route.useLoaderData();

  return (
    <AdminAuditLogsView
      query={query}
      auditLogs={data?.auditLogs ?? null}
      facets={data?.facets ?? EMPTY_FACETS}
    />
  );
}
