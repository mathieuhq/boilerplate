import { LayoutDashboard, Server, Settings, Shield } from "lucide-react";

import { useTranslations } from "@/i18n";
import type { SidebarGroup } from "@/types/sidebar";

export function useSidebarItems(): SidebarGroup[] {
  const t = useTranslations("navigation");

  return [
    {
      title: t("general"),
      items: [
        {
          url: "/",
          title: t("dashboard"),
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: t("other"),
      items: [
        {
          icon: Settings,
          title: t("settings"),
          url: "/settings/profile",
        },
        {
          icon: Server,
          title: t("mcp"),
          url: "/mcp",
        },
        {
          icon: Shield,
          adminOnly: true,
          title: t("administrator"),
          url: "/admin",
        },
      ],
    },
  ];
}
