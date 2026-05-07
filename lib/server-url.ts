import { env } from "@/lib/env";
import { SITE_CONFIG } from "@/lib/site-config";

export const getServerUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;

  if (env.BETTER_AUTH_URL) return env.BETTER_AUTH_URL;

  if (process.env.NODE_ENV === "production") return SITE_CONFIG.SERVER.PROD_URL;

  return "http://localhost:3000";
};
