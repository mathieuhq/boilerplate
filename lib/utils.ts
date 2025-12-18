import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import type { SidebarItem } from "@/types/sidebar";

/**
 * Merges Tailwind CSS classes with proper conflict resolution
 */
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

/**
 * Generates user initials from name or email for avatar fallbacks
 *
 * Logic:
 * - If name has multiple words → first letter of first two words (e.g., "John Doe" → "JD")
 * - If name is single word → first two letters uppercase (e.g., "John" → "JO")
 * - If no name → first two letters of email (e.g., "john@example.com" → "JO")
 *
 * @param name - User's display name
 * @param email - User's email address
 * @returns Two uppercase letters representing user initials
 */
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

/**
 * Formats a price amount with currency symbol
 *
 * @param amount - The numeric amount to format
 * @param currency - The currency code (e.g., "EUR", "USD")
 * @returns Formatted price string (e.g., "€9", "$10")
 */
export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a date in US locale with full month name
 *
 * @param date - Date string or Date object to format
 * @returns Formatted date string (e.g., "December 18, 2025")
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
