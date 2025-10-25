import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import type { SidebarItem } from "@/types/sidebar";

/**
 * Merges Tailwind CSS classes with proper conflict resolution
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const checkIsActive = (
  href: string,
  item: SidebarItem,
  mainSidebar = false,
) =>
  href === item.url ||
  href.split("?")[0] === item.url ||
  !!item.items?.filter((i) => i.url === href).length ||
  (mainSidebar &&
    href.split("/")[1] !== "" &&
    href.split("/")[1] === item.url?.split("/")[1]);
