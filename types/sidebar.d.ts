interface BaseSidebarItem {
  title: string;
  badge?: string;
  icon?: React.ElementType;
  adminOnly?: boolean;
}

type NestedItem = BaseSidebarItem & { url: string };

export type SidebarItem =
  | (BaseSidebarItem & {
      items: NestedItem[];
      url?: never;
    })
  | (BaseSidebarItem & {
      url: string;
      items?: never;
    });

export interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}
