import { createFileRoute } from "@tanstack/react-router";

import { getPageMetaTags } from "@/lib/seo";
import { getAdminAuditLogsData } from "@/server-functions/admin.functions";
import { AdminAuditLogsView } from "@/views/admin/audit-logs";

const DEFAULT_LIMIT = 20;

export const Route = createFileRoute("/_dashboard/admin/audit-logs")({
  head: () => ({
    meta: getPageMetaTags("adminAuditLogs"),
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    page: toPositiveNumber(search.page, 1),
    limit: toPositiveNumber(search.limit, DEFAULT_LIMIT),
    action: toOptionalString(search.action),
    actorUserId: toOptionalString(search.actorUserId),
    resourceType: toOptionalString(search.resourceType),
    from: toOptionalString(search.from),
    to: toOptionalString(search.to),
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => getAdminAuditLogsData(deps),
  component: AdminAuditLogsPage,
});

function AdminAuditLogsPage() {
  const filters = Route.useSearch();
  const auditLogs = Route.useLoaderData();

  return <AdminAuditLogsView filters={filters} auditLogs={auditLogs} />;
}

function toPositiveNumber(value: unknown, fallback: number) {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue < 1) return fallback;

  return numberValue;
}

function toOptionalString(value: unknown) {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
