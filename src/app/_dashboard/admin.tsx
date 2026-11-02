import {
  createFileRoute,
  type ErrorComponentProps,
  Outlet,
} from "@tanstack/react-router";
import { Building2, ClipboardList, Home, Users } from "lucide-react";

import { SectionTemplate } from "@/components/features/dashboard/section-template";
import { SidebarLayout } from "@/components/features/dashboard/sidebar/sidebar-layout";
import { useTranslations } from "@/i18n";
import { requireAdmin } from "@/server-functions/auth.functions";
import { HttpError } from "@/shared/domain/errors/http.error";
import { ForbiddenView } from "@/views/errors/403";
import { InternalServerErrorView } from "@/views/errors/500";

export const Route = createFileRoute("/_dashboard/admin")({
  beforeLoad: async () => {
    const session = await requireAdmin();

    if (!session?.user) throw HttpError.forbidden("Admin access required");

    return { user: session.user };
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

function AdminLayout() {
  const t = useTranslations("navigation");

  const sidebarItems = [
    {
      title: t("overview"),
      icon: <Home />,
      href: "/admin/overview",
    },
    {
      title: t("users"),
      icon: <Users />,
      href: "/admin/users",
    },
    {
      title: t("organizations"),
      icon: <Building2 />,
      href: "/admin/organizations",
    },
    {
      title: t("auditLogs"),
      icon: <ClipboardList />,
      href: "/admin/audit-logs",
    },
  ];

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
