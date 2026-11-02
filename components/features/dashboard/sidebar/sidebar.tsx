import { useMemo } from "react";

import { SidebarUser } from "@/components/features/dashboard/sidebar/sidebar-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { OrganizationResponseDTO } from "@/features/organization/application/dto/organization-response.dto";
import type { AuthUser } from "@/types/auth-user";

import { useSidebarItems } from "./sidebar.constants";
import { SidebarGroup } from "./sidebar-group";
import { SidebarOrganizationSwitcher } from "./sidebar-organization-switcher";

type Props = React.ComponentProps<typeof Sidebar> & {
  user: AuthUser;
  activeOrganizationId: string;
  organizations: OrganizationResponseDTO[];
};

export const DashboardSidebar = ({
  user,
  organizations,
  activeOrganizationId,
  ...props
}: Props) => {
  const isAdmin = user.role === "admin";

  const sidebarItems = useSidebarItems();

  const filteredItems = useMemo(() => {
    return sidebarItems.map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.adminOnly || isAdmin),
    }));
  }, [isAdmin, sidebarItems]);

  return (
    <div className="relative">
      <Sidebar collapsible="icon" {...props}>
        <SidebarOrganizationSwitcher
          organizations={organizations}
          activeOrganizationId={activeOrganizationId}
        />
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
