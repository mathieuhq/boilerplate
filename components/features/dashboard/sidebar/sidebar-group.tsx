import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  SidebarGroup as SidebarGroupComponent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "@/lib/navigation";
import { usePathname } from "@/lib/navigation";
import { checkIsActive } from "@/lib/utils";
import type { SidebarGroup as SidebarGroupProps } from "@/types/sidebar";

export const SidebarGroup = ({ title, items }: SidebarGroupProps) => {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarGroupComponent>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
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
        })}
      </SidebarMenu>
    </SidebarGroupComponent>
  );
};

const SidebarBadge = ({ children }: { children: ReactNode }) => (
  <Badge className="rounded-full px-1 py-0 text-xs">{children}</Badge>
);
