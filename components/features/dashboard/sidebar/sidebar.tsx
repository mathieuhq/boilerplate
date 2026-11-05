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

import { SidebarGroup } from "./sidebar-group";
import { SidebarOrganizationSwitcher } from "./sidebar-organization-switcher";
import { useSidebarItems } from "./sidebar.constants";

type Props = React.ComponentProps<typeof Sidebar> & {
  user: AuthUser;
  hasAdminAccess: boolean;
  activeOrganizationId: string;
  organizations: OrganizationResponseDTO[];
  canCreateOrganization: boolean;
};

export const DashboardSidebar = ({
  user,
  hasAdminAccess,
  organizations,
  activeOrganizationId,
  canCreateOrganization,
  ...props
}: Props) => {
  const sidebarItems = useSidebarItems();

  const filteredItems = useMemo(() => {
    return sidebarItems.map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.adminOnly || hasAdminAccess),
    }));
  }, [hasAdminAccess, sidebarItems]);

  return (
    <div className="relative">
      <Sidebar collapsible="icon" {...props}>
        <SidebarOrganizationSwitcher
          organizations={organizations}
          activeOrganizationId={activeOrganizationId}
          canCreateOrganization={canCreateOrganization}
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
