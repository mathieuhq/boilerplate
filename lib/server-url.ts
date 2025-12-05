import { SITE_CONFIG } from "@/lib/site-config";

/**
 * Returns the current server URL based on environment
 */
export const getServerUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;

  if (process.env.NODE_ENV === "production") return SITE_CONFIG.SERVER.PROD_URL;

  return "http://localhost:3000";
};
