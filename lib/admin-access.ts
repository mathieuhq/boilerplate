import {
  type AccessFeature,
  type AccessGrants,
  hasAccess,
} from "@/shared/domain/access-control";

export const ADMIN_PAGES = [
  { href: "/admin/overview", feature: "overview", titleKey: "overview" },
  { href: "/admin/users", feature: "users", titleKey: "users" },
  {
    href: "/admin/organizations",
    feature: "organizations",
    titleKey: "organizations",
  },
  { href: "/admin/audit-logs", feature: "audit-logs", titleKey: "auditLogs" },
  { href: "/admin/roles", feature: "roles", titleKey: "roles" },
] as const satisfies readonly {
  href: string;
  feature: AccessFeature;
  titleKey: string;
}[];

export type AdminPageHref = (typeof ADMIN_PAGES)[number]["href"];

export function getAdminPageFeature(pathname: string) {
  return ADMIN_PAGES.find(
    (page) => pathname === page.href || pathname.startsWith(`${page.href}/`),
  )?.feature;
}

export function getAdminPages(access: AccessGrants) {
  return ADMIN_PAGES.filter((page) => hasAccess(access, page.feature, "read"));
}

export function getFirstAdminPage(access: AccessGrants) {
  return getAdminPages(access).at(0)?.href;
}
