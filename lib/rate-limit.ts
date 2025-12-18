import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export const ratelimit = new Ratelimit({
  redis,
  analytics: true,
  prefix: "@boilerplate/ratelimit",
  limiter: Ratelimit.slidingWindow(100, "60 s"),
});
