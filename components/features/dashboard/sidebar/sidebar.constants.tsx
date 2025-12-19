"use client";

import { useTranslations } from "next-intl";
import {
  Bell,
  Coins,
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
          title: t("dashboard"),
          icon: LayoutDashboard,
          items: [
            {
              title: "Dashboard 1",
              url: "/",
            },
            {
              title: "Dashboard 2",
              url: "/dashboard-2",
            },
            {
              title: "Dashboard 3",
              url: "/dashboard-3",
            },
          ],
        },
      ],
    },
    {
      title: t("other"),
      url: "/settings",
      items: [
        {
          title: t("settings"),
          icon: Settings,
          items: [
            {
              title: t("profile"),
              icon: User,
              url: "/settings/profile",
            },
            {
              title: t("billing"),
              icon: Coins,
              url: "/settings/billing",
            },
            {
              title: t("notifications"),
              icon: Bell,
              url: "/settings/notifications",
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
