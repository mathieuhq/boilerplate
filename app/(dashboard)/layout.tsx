import { cookies } from "next/headers";

import { DashboardSidebar } from "@/components/features/dashboard/sidebar/sidebar";
import { SidebarHeader } from "@/components/features/dashboard/sidebar/sidebar-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getLatestVersion } from "@/lib/changelog";
import { cn } from "@/lib/utils";
import { container } from "@/shared/infrastructure/di/container";

type Props = {
  children: React.ReactNode;
};

export default async function DashboardLayout({ children }: Props) {
  const cookieStore = await cookies();
  const userController = container.getUserController();
  const organizationController = container.getOrganizationController();
  const user = await userController.getCurrentUser();
  const isOrgAdmin =
    await organizationController.canManageCurrentUserOrganization();

  const defaultClose = cookieStore.get("sidebar:state")?.value === "false";

  return (
    <div className="border-grid flex flex-1 flex-col">
      <SidebarProvider defaultOpen={!defaultClose}>
        <DashboardSidebar user={user} isOrgAdmin={isOrgAdmin} />
        <div
          id="content"
          className={cn(
            "flex h-full w-full flex-col",
            "has-[div[data-layout=fixed]]:h-svh",
            "group-data-[scroll-locked=1]/body:h-full",
            "has-[data-layout=fixed]:group-data-[scroll-locked=1]/body:h-svh",
          )}
        >
          <SidebarHeader latestVersion={getLatestVersion()} />
          <div className="flex-1">{children}</div>
        </div>
      </SidebarProvider>
    </div>
  );
}
