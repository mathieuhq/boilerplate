import { createFileRoute } from "@tanstack/react-router";

import { getPageMetaTags } from "@/lib/seo";
import { getAdminUsersData } from "@/server-functions/admin.functions";
import { AdminUsersView } from "@/views/admin/users";

const DEFAULT_LIMIT = 20;

export const Route = createFileRoute("/_dashboard/admin/users")({
  head: () => ({
    meta: getPageMetaTags("adminUsers"),
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    page: toPositiveNumber(search.page, 1),
    limit: toPositiveNumber(search.limit, DEFAULT_LIMIT),
    search: toOptionalString(search.search),
    role: toOptionalRole(search.role),
    banned: toOptionalBoolean(search.banned),
    emailVerified: toOptionalBoolean(search.emailVerified),
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => getAdminUsersData(deps),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const filters = Route.useSearch();
  const users = Route.useLoaderData();

  return <AdminUsersView users={users} filters={filters} />;
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

function toOptionalBoolean(value: unknown) {
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;

  return undefined;
}

function toOptionalRole(value: unknown): "admin" | "user" | undefined {
  if (value === "admin" || value === "user") return value;

  return undefined;
}
