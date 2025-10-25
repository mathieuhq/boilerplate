import { cookies } from "next/headers";

import { DashboardSidebar } from "@/components/features/dashboard/sidebar/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { authService } from "@/services/auth/auth.service";

type Props = {
  children: React.ReactNode;
};

export default async function DashboardLayout({ children }: Props) {
  const cookieStore = await cookies();
  const user = await authService.getRequiredUser();
  const defaultClose = cookieStore.get("sidebar:state")?.value === "false";

  return (
    <div className="border-grid flex flex-1 flex-col">
      <SidebarProvider defaultOpen={!defaultClose}>
        <DashboardSidebar user={user} />
        <div
          id="content"
          className={cn(
            "flex h-full w-full flex-col",
            "has-[div[data-layout=fixed]]:h-svh",
            "group-data-[scroll-locked=1]/body:h-full",
            "has-[data-layout=fixed]:group-data-[scroll-locked=1]/body:h-svh",
          )}
        >
          {children}
        </div>
      </SidebarProvider>
    </div>
  );
}
