"use client";

import { useMemo } from "react";

import { SidebarUser } from "@/components/features/dashboard/sidebar/sidebar-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { AuthUser } from "@/types/auth-user";

import { SIDEBAR_ITEMS } from "./sidebar.constants";
import { SidebarGroup } from "./sidebar-group";

type Props = React.ComponentProps<typeof Sidebar> & {
  user: AuthUser;
};

export const DashboardSidebar = ({ user, ...props }: Props) => {
  const isAdmin = user.role === "admin";

  const filteredItems = useMemo(() => {
    return SIDEBAR_ITEMS.filter((group) => !group.adminOnly || isAdmin);
  }, [isAdmin]);

  return (
    <div className="relative">
      <Sidebar collapsible="icon" {...props}>
        <SidebarContent>
          {filteredItems.map((props) => (
            <SidebarGroup key={props.title} {...props} />
          ))}
        </SidebarContent>
        <SidebarFooter>
          <SidebarUser user={user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </div>
  );
};
