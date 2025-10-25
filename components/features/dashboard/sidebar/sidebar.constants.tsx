import {
  AppWindow,
  Bell,
  Bug,
  Code,
  Coins,
  Construction,
  FileQuestion,
  LayoutDashboard,
  ListChecks,
  Lock,
  ServerOff,
  Settings,
  ShieldCheck,
  User,
  Users,
  UserX,
  Wrench,
} from "lucide-react";

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
      {
        title: "Tasks",
        url: "/tasks",
        icon: ListChecks,
      },
      {
        title: "Users",
        url: "/users",
        icon: Users,
      },
    ],
  },
  {
    title: "Pages",
    items: [
      {
        title: "Auth",
        icon: ShieldCheck,
        items: [
          {
            title: "Login",
            url: "/login",
          },
          {
            title: "Register",
            url: "/register",
          },
          {
            title: "Forgot Password",
            url: "/forgot-password",
          },
        ],
      },
      {
        title: "Errors",
        icon: Bug,
        items: [
          {
            title: "Unauthorized",
            url: "/401",
            icon: Lock,
          },
          {
            title: "Forbidden",
            url: "/403",
            icon: UserX,
          },
          {
            title: "Not Found",
            url: "/404",
            icon: FileQuestion,
          },
          {
            title: "Internal Server Error",
            url: "/error",
            icon: ServerOff,
          },
          {
            title: "Maintenance Error",
            url: "/503",
            icon: Construction,
          },
        ],
      },
    ],
  },
  {
    title: "Other",
    items: [
      {
        title: "Settings",
        icon: Settings,
        items: [
          {
            title: "General",
            icon: Wrench,
            url: "/settings",
          },
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
            title: "Plans",
            icon: ListChecks,
            url: "/settings/plans",
          },
          {
            title: "Connected Apps",
            icon: AppWindow,
            url: "/settings/connected-apps",
          },
          {
            title: "Notifications",
            icon: Bell,
            url: "/settings/notifications",
          },
        ],
      },
      {
        title: "Developers",
        icon: Code,
        items: [
          {
            title: "Overview",
            url: "/developers/overview",
          },
          {
            title: "API Keys",
            url: "/developers/api-keys",
          },
          {
            title: "Webhooks",
            url: "/developers/webhooks",
          },
          {
            title: "Events/Logs",
            url: "/developers/events-&-logs",
          },
        ],
      },
    ],
  },
];
