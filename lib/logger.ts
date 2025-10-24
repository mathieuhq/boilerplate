import { Logger } from "tslog";

import { SITE_CONFIG } from "@/lib/site-config";

/**
 * Global logger instance configured for the application
 */
export const logger = new Logger({
  name: SITE_CONFIG.TITLE,
  minLevel: process.env.NODE_ENV === "production" ? 3 : 0,
});
