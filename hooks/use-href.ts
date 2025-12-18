import { useClient } from "@/hooks/use-client";

/**
 * React hook that returns the current pathname
 */
export function useHref() {
  const isClient = useClient();

  if (!isClient) return "";

  const pathname = window.location.pathname;

  return pathname;
}
