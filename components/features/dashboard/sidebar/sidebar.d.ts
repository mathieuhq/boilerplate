interface BaseSidebarItem {
  title: string;
  badge?: string;
  icon?: React.ElementType;
}

export type SidebarItem =
  | (BaseSidebarItem & {
      items: (BaseSidebarItem & { url: string })[];
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
