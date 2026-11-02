export interface SidebarItem {
  url: string;
  title: string;
  badge?: string;
  icon?: React.ElementType;
  adminOnly?: boolean;
}

export interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}
