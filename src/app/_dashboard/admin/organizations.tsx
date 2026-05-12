import { createFileRoute } from "@tanstack/react-router";

import { getPageMetaTags } from "@/lib/seo";
import { getAdminOrganizationsData } from "@/server-functions/admin.functions";
import { AdminOrganizationsView } from "@/views/admin/organizations";

const DEFAULT_LIMIT = 20;

export const Route = createFileRoute("/_dashboard/admin/organizations")({
  head: () => ({
    meta: getPageMetaTags("adminOrganizations"),
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    page: toPositiveNumber(search.page, 1),
    limit: toPositiveNumber(search.limit, DEFAULT_LIMIT),
    search: toOptionalString(search.search),
    organizationId: toOptionalString(search.organizationId),
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => getAdminOrganizationsData(deps),
  component: AdminOrganizationsPage,
});

function AdminOrganizationsPage() {
  const filters = Route.useSearch();
  const { organizations, organization } = Route.useLoaderData();

  return (
    <AdminOrganizationsView
      filters={filters}
      organization={organization}
      organizations={organizations}
    />
  );
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
