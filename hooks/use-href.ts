import { useClient } from "@/hooks/use-client";

export const useHref = () => {
  const isClient = useClient();

  if (!isClient) return "";

  const pathname = window.location.pathname;

  return pathname;
};
