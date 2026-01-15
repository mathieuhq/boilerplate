"use client";

import { useTranslations } from "next-intl";
import {
  Bell,
  Building2,
  House,
  LayoutDashboard,
  Settings,
  Shield,
  User,
} from "lucide-react";

export function useSidebarItems() {
  const t = useTranslations("navigation");

  return [
    {
      title: t("general"),
      items: [
        {
          url: "/dashboard",
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
          ],
        },
      ],
    },
  ];
}
