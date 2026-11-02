import { createFileRoute } from "@tanstack/react-router";

import { getPageMetaTags } from "@/lib/seo";
import { getOrganizationActivityData } from "@/server-functions/organization-activity.functions";
import { OrganizationActivityView } from "@/views/settings/organization-activity";

const DEFAULT_LIMIT = 20;

export const Route = createFileRoute(
  "/_dashboard/settings/organization-activity",
)({
  head: () => ({
    meta: getPageMetaTags("settingsOrganizationActivity"),
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    page: toPositiveNumber(search.page, 1),
    limit: Math.min(100, toPositiveNumber(search.limit, DEFAULT_LIMIT)),
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => getOrganizationActivityData({ data: deps }),
  component: OrganizationActivityPage,
});

function OrganizationActivityPage() {
  const { limit } = Route.useSearch();
  const { organization, auditLogs } = Route.useLoaderData();

  return (
    <OrganizationActivityView
      organization={organization}
      auditLogs={auditLogs}
      limit={limit}
    />
  );
}

function toPositiveNumber(value: unknown, fallback: number) {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue < 1) return fallback;

  return numberValue;
}
