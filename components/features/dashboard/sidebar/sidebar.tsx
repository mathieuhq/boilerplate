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

import { useSidebarItems } from "./sidebar.constants";
import { SidebarGroup } from "./sidebar-group";

type Props = React.ComponentProps<typeof Sidebar> & {
  user: AuthUser;
  isOrgAdmin: boolean;
};

export const DashboardSidebar = ({ user, isOrgAdmin, ...props }: Props) => {
  const isAdmin = user.role === "admin";
  const sidebarItems = useSidebarItems();

  const filteredItems = useMemo(() => {
    return sidebarItems.map((group) => ({
      ...group,
      items: group.items
        .filter((item) => {
          if ("adminOnly" in item && item.adminOnly) return isAdmin;
          return true;
        })
        .map((item) => {
          if ("items" in item) {
            return {
              ...item,
              items: item.items.filter((subItem) => {
                if ("orgAdminOnly" in subItem && subItem.orgAdminOnly)
                  return isOrgAdmin;
                if ("adminOnly" in subItem && subItem.adminOnly) return isAdmin;
                return true;
              }),
            };
          }
          return item;
        }),
    }));
  }, [isAdmin, isOrgAdmin, sidebarItems]);

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
