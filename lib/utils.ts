import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import type { SidebarItem } from "@/types/sidebar";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function checkIsActive(
  href: string,
  item: SidebarItem,
  mainSidebar = false,
): boolean {
  return (
    href === item.url ||
    href.split("?")[0] === item.url ||
    !!item.items?.filter((i) => i.url === href).length ||
    (mainSidebar &&
      href.split("/")[1] !== "" &&
      href.split("/")[1] === item.url?.split("/")[1])
  );
}

export function getUserInitials(name: string, email: string): string {
  const source = name.trim() || email;

  if (!source) return "??";

  const words = source.trim().split(/\s+/);

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  } else {
    const word = words[0];
    if (word.length >= 2) return word.substring(0, 2).toUpperCase();
    else return (word[0] + word[0]).toUpperCase();
  }
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
