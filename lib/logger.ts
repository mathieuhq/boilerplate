import { Logger } from "tslog";
import { SITE_CONFIG } from "@/lib/site-config";

export const logger = new Logger({
  name: SITE_CONFIG.TITLE,
  minLevel: process.env.NODE_ENV === "production" ? 3 : 0,
});
