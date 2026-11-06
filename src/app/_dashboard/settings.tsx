import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  CreditCard,
  History,
  KeyRound,
  Shield,
  User,
} from "lucide-react";

import { SectionTemplate } from "@/components/features/dashboard/section-template";
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
    ...(isOrgAdmin
      ? [
          {
            title: t("billing"),
            icon: <CreditCard />,
            href: "/settings/billing",
          },
        ]
      : []),
    {
      title: t("security"),
      icon: <Shield />,
      href: "/settings/security",
    },
    {
      title: t("apiKeys"),
      icon: <KeyRound />,
      href: "/settings/api-keys",
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
          {
            title: t("organizationActivity"),
            icon: <History />,
            href: "/settings/organization-activity",
          },
        ]
      : []),
  ];

  return (
    <SectionTemplate
      title={t("settings")}
      description={t("settingsDescription")}
      nav={<SidebarLayout items={sidebarItems} />}
    >
      <Outlet />
    </SectionTemplate>
  );
}
