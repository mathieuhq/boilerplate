import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup as SidebarGroupComponent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "@/lib/navigation";
import { usePathname } from "@/lib/navigation";
import { checkIsActive } from "@/lib/utils";

import type { SidebarGroup as SidebarGroupProps } from "../../../../types/sidebar";

type CollapsedLinkButtonProps = {
  item: {
    url: string;
    title: string;
    badge?: string;
    icon?: React.ElementType;
  };
  isActive: boolean;
  onClick: () => void;
};

const CollapsedLinkButton = ({
  item,
  onClick,
  isActive,
}: CollapsedLinkButtonProps) => (
  <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
    <Link href={item.url} onClick={onClick}>
      {item.icon && <item.icon />}
      <span>{item.title}</span>
      {item.badge && <SidebarBadge>{item.badge}</SidebarBadge>}
    </Link>
  </SidebarMenuButton>
);

export const SidebarGroup = ({ title, items }: SidebarGroupProps) => {
  const pathname = usePathname();
  const { setOpenMobile, state } = useSidebar();

  const isCollapsed = state === "collapsed";

  return (
    <SidebarGroupComponent>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          if (!item.items) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={checkIsActive(pathname, item, true)}
                >
                  <Link href={item.url} onClick={() => setOpenMobile(false)}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.badge && <SidebarBadge>{item.badge}</SidebarBadge>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          const firstItemUrl = item.items[0]?.url;

          if (isCollapsed && firstItemUrl) {
            return (
              <SidebarMenuItem key={item.title}>
                <CollapsedLinkButton
                  onClick={() => setOpenMobile(false)}
                  item={{ ...item, url: firstItemUrl }}
                  isActive={checkIsActive(pathname, item, true)}
                />
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible
              asChild
              key={item.title}
              className="group/collapsible"
              defaultOpen={checkIsActive(pathname, item, true)}
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.badge && <SidebarBadge>{item.badge}</SidebarBadge>}
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="CollapsibleContent">
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={checkIsActive(pathname, subItem)}
                        >
                          <Link
                            href={subItem.url}
                            onClick={() => setOpenMobile(false)}
                          >
                            {subItem.icon && <subItem.icon />}
                            <span>{subItem.title}</span>
                            {subItem.badge && (
                              <SidebarBadge>{subItem.badge}</SidebarBadge>
                            )}
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroupComponent>
  );
};

const SidebarBadge = ({ children }: { children: ReactNode }) => (
  <Badge className="rounded-full px-1 py-0 text-xs">{children}</Badge>
);
