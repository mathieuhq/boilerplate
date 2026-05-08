import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { DashboardSidebar } from "@/components/features/dashboard/sidebar/sidebar";
import { SidebarHeader } from "@/components/features/dashboard/sidebar/sidebar-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { requireSession } from "@/server-functions/auth.functions";
import { getDashboardLayoutData } from "@/server-functions/page-data.functions";

export const Route = createFileRoute("/_dashboard")({
  beforeLoad: async ({ location }) => {
    const session = await requireSession();

    if (!session?.user)
      throw redirect({
        to: "/auth/signin",
        search: { callbackUrl: location.href },
      });

    return { user: session.user };
  },
  loader: async () => getDashboardLayoutData(),
  component: DashboardLayout,
});

function DashboardLayout() {
  const {
    user,
    isOrgAdmin,
    defaultOpen,
    latestVersion,
    organizations,
    activeOrganizationId,
  } = Route.useLoaderData();

  return (
    <div className="border-grid flex flex-1 flex-col">
      <SidebarProvider defaultOpen={defaultOpen}>
        <DashboardSidebar
          user={user}
          isOrgAdmin={isOrgAdmin}
          organizations={organizations}
          activeOrganizationId={activeOrganizationId}
        />
        <div
          id="content"
          className={cn(
            "flex h-full w-full flex-col",
            "has-[div[data-layout=fixed]]:h-svh",
            "group-data-[scroll-locked=1]/body:h-full",
            "has-[data-layout=fixed]:group-data-[scroll-locked=1]/body:h-svh",
          )}
        >
          <SidebarHeader latestVersion={latestVersion} />
          <div className="flex-1">
            <Outlet />
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
