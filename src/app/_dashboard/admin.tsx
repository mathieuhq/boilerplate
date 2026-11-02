import type { JSX } from "react";
import {
  createFileRoute,
  type ErrorComponentProps,
  Outlet,
} from "@tanstack/react-router";
import { Building2, ClipboardList, Home, KeyRound, Users } from "lucide-react";

import { SectionTemplate } from "@/components/features/dashboard/section-template";
import { SidebarLayout } from "@/components/features/dashboard/sidebar/sidebar-layout";
import { useTranslations } from "@/i18n";
import { assertAccess } from "@/lib/access";
import {
  type AdminPageHref,
  getAdminPageFeature,
  getAdminPages,
} from "@/lib/admin-access";
import { HttpError } from "@/shared/domain/errors/http.error";
import { ForbiddenView } from "@/views/errors/403";
import { InternalServerErrorView } from "@/views/errors/500";

export const Route = createFileRoute("/_dashboard/admin")({
  beforeLoad: ({ context, location }) => {
    if (getAdminPages(context.access).length === 0)
      throw HttpError.forbidden("Admin access required");

    const feature = getAdminPageFeature(location.pathname);

    if (feature) assertAccess(context.access, feature, "read");
  },
  component: AdminLayout,
  errorComponent: AdminErrorComponent,
});

function isForbiddenError(error: unknown) {
  if (error instanceof HttpError) return error.code === "FORBIDDEN";

  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "FORBIDDEN"
  );
}

function AdminErrorComponent({ error }: ErrorComponentProps) {
  if (isForbiddenError(error)) return <ForbiddenView />;

  return <InternalServerErrorView />;
}

const ADMIN_PAGE_NAVIGATION: Record<
  AdminPageHref,
  { titleKey: string; icon: JSX.Element }
> = {
  "/admin/overview": { titleKey: "overview", icon: <Home /> },
  "/admin/users": { titleKey: "users", icon: <Users /> },
  "/admin/organizations": { titleKey: "organizations", icon: <Building2 /> },
  "/admin/audit-logs": { titleKey: "auditLogs", icon: <ClipboardList /> },
  "/admin/roles": { titleKey: "roles", icon: <KeyRound /> },
};

function AdminLayout() {
  const t = useTranslations("navigation");
  const { access } = Route.useRouteContext();

  const sidebarItems = getAdminPages(access).map((page) => ({
    href: page.href,
    title: t(ADMIN_PAGE_NAVIGATION[page.href].titleKey),
    icon: ADMIN_PAGE_NAVIGATION[page.href].icon,
  }));

  return (
    <SectionTemplate
      title={t("administrator")}
      description={t("adminDescription")}
      nav={<SidebarLayout items={sidebarItems} />}
    >
      <Outlet />
    </SectionTemplate>
  );
}
