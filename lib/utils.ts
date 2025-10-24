import { type ClassValue,clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with proper conflict resolution
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
