import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { SITE_CONFIG } from "./site-config";

const redis = Redis.fromEnv();

export const ratelimit = new Ratelimit({
  redis,
  analytics: true,
  prefix: `@${SITE_CONFIG.APP_ID}/ratelimit`,
  limiter: Ratelimit.slidingWindow(100, "60 s"),
});
