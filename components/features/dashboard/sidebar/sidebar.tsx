"use client";

import type { User } from "better-auth";

import { SidebarUser } from "@/components/features/dashboard/sidebar/sidebar-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";

import { SIDEBAR_ITEMS } from "./sidebar.constants";
import { SidebarGroup } from "./sidebar-group";

type DashboardSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: User;
};

export const DashboardSidebar = ({ user, ...props }: DashboardSidebarProps) => {
  return (
    <div className="relative">
      <Sidebar collapsible="icon" {...props}>
        <SidebarContent>
          {SIDEBAR_ITEMS.map((props) => (
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
