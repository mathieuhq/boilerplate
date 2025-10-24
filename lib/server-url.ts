import { SITE_CONFIG } from "@/lib/site-config";

export const getServerUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;

  if (process.env.NODE_ENV === "production") return SITE_CONFIG.SERVER.PROD_URL;

  if (process.env.NODE_ENV === "test") return SITE_CONFIG.SERVER.TEST_URL;

  return "http://localhost:3000";
};
