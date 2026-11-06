import type { JSX } from "react";
import {
  createFileRoute,
  type ErrorComponentProps,
  Outlet,
} from "@tanstack/react-router";
import {
  Building2,
  ClipboardList,
  Home,
  KeyRound,
  ListChecks,
  Users,
} from "lucide-react";

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

const ADMIN_PAGE_ICONS: Record<AdminPageHref, JSX.Element> = {
  "/admin/overview": <Home />,
  "/admin/users": <Users />,
  "/admin/organizations": <Building2 />,
  "/admin/audit-logs": <ClipboardList />,
  "/admin/jobs": <ListChecks />,
  "/admin/roles": <KeyRound />,
};

function AdminLayout() {
  const t = useTranslations("navigation");
  const { access } = Route.useRouteContext();

  const sidebarItems = getAdminPages(access).map((page) => ({
    href: page.href,
    title: t(page.titleKey),
    icon: ADMIN_PAGE_ICONS[page.href],
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
