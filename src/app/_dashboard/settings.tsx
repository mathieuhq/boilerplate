import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Bell, Building2, User } from "lucide-react";

import { SidebarLayout } from "@/components/features/dashboard/sidebar/sidebar-layout";
import { useTranslations } from "@/i18n";
import { getSettingsLayoutData } from "@/server-functions/page-data.functions";

export const Route = createFileRoute("/_dashboard/settings")({
  loader: async () => getSettingsLayoutData(),
  component: SettingsLayout,
});

function SettingsLayout() {
  const { isOrgAdmin } = Route.useLoaderData();
  const t = useTranslations("navigation");

  const sidebarItems = [
    {
      title: t("profile"),
      icon: <User />,
      href: "/settings/profile",
    },
    {
      title: t("notifications"),
      icon: <Bell />,
      href: "/settings/notifications",
    },
    ...(isOrgAdmin
      ? [
          {
            title: t("organization"),
            icon: <Building2 />,
            href: "/settings/organization",
          },
        ]
      : []),
  ];

  return (
    <div
      data-layout="fixed"
      className="flex flex-1 flex-col gap-4 overflow-hidden p-4"
    >
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">
          {t("settings")}
        </h1>
        <p className="text-muted-foreground">{t("settingsDescription")}</p>
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
