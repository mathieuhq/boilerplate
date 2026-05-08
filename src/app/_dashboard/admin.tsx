import {
  createFileRoute,
  type ErrorComponentProps,
  Outlet,
} from "@tanstack/react-router";
import { Home } from "lucide-react";

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
  ];

  return (
    <div
      data-layout="fixed"
      className="flex flex-1 flex-col gap-4 overflow-hidden p-4"
    >
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">
          {t("administrator")}
        </h1>
        <p className="text-muted-foreground">{t("adminDescription")}</p>
      </div>
      <div className="flex flex-1 flex-col space-y-8 overflow-auto md:space-y-2 md:overflow-hidden lg:flex-row lg:space-y-0 lg:space-x-12">
        <aside className="lg:sticky lg:w-1/5">
          <SidebarLayout items={sidebarItems} />
        </aside>
        <div className="flex w-full overflow-y-scroll p-1 pr-4 md:overflow-y-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
