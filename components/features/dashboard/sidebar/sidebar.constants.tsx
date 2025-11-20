import { Bell, Coins, LayoutDashboard, Settings, User } from "lucide-react";

export const SIDEBAR_ITEMS = [
  {
    title: "General",
    items: [
      {
        title: "Dashboard",
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
    title: "Other",
    url: "/settings",
    items: [
      {
        title: "Settings",
        icon: Settings,
        items: [
          {
            title: "Profile",
            icon: User,
            url: "/settings/profile",
          },
          {
            title: "Billing",
            icon: Coins,
            url: "/settings/billing",
          },
          {
            title: "Notifications",
            icon: Bell,
            url: "/settings/notifications",
          },
        ],
      },
    ],
  },
];
