import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { ImpersonationBanner } from "@/components/features/dashboard/impersonation-banner";
import { DashboardSidebar } from "@/components/features/dashboard/sidebar/sidebar";
import { SidebarHeader } from "@/components/features/dashboard/sidebar/sidebar-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getAdminPages } from "@/lib/admin-access";
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

    return {
      user: session.user,
      access: session.access,
      impersonation: session.impersonation,
    };
  },
  loader: async () => getDashboardLayoutData(),
  component: DashboardLayout,
});

function DashboardLayout() {
  const {
    user,
    defaultOpen,
    latestVersion,
    organizations,
    activeOrganizationId,
    canCreateOrganization,
  } = Route.useLoaderData();
  const { access, impersonation } = Route.useRouteContext();

  return (
    <div className="border-grid flex flex-1 flex-col">
      <SidebarProvider defaultOpen={defaultOpen}>
        <DashboardSidebar
          user={user}
          hasAdminAccess={getAdminPages(access).length > 0}
          organizations={organizations}
          activeOrganizationId={activeOrganizationId}
          canCreateOrganization={canCreateOrganization}
        />
        <div
          id="content"
          className={cn(
            "flex h-full w-full min-w-0 flex-col",
            "has-[div[data-layout=fixed]]:h-svh",
            "group-data-[scroll-locked=1]/body:h-full",
            "has-[data-layout=fixed]:group-data-[scroll-locked=1]/body:h-svh",
          )}
        >
          {impersonation && (
            <ImpersonationBanner
              name={user.name}
              email={user.email}
              expiresAt={impersonation.expiresAt}
            />
          )}
          <SidebarHeader latestVersion={latestVersion} />
          <div className="flex min-h-0 flex-1 flex-col">
            <Outlet />
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
