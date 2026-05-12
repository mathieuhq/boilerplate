import {
  Bell,
  Building2,
  ClipboardList,
  House,
  LayoutDashboard,
  Settings,
  Shield,
  User,
  Users,
} from "lucide-react";

import { useTranslations } from "@/i18n";

export function useSidebarItems() {
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
          items: [
            {
              icon: User,
              title: t("profile"),
              url: "/settings/profile",
            },
            {
              icon: Bell,
              title: t("notifications"),
              url: "/settings/notifications",
            },
            {
              icon: Building2,
              orgAdminOnly: true,
              title: t("organization"),
              url: "/settings/organization",
            },
          ],
        },
        {
          icon: Shield,
          adminOnly: true,
          title: t("administrator"),
          items: [
            {
              icon: House,
              adminOnly: true,
              title: t("overview"),
              url: "/admin/overview",
            },
            {
              icon: Users,
              adminOnly: true,
              title: t("users"),
              url: "/admin/users",
            },
            {
              icon: Building2,
              adminOnly: true,
              title: t("organizations"),
              url: "/admin/organizations",
            },
            {
              icon: ClipboardList,
              adminOnly: true,
              title: t("auditLogs"),
              url: "/admin/audit-logs",
            },
          ],
        },
      ],
    },
  ];
}
