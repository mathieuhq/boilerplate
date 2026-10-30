import { env } from "@/lib/env";
import { redis } from "@/lib/redis";
import { createRateLimiter } from "@/shared/infrastructure/rate-limit/rate-limiter";

export const ratelimit = createRateLimiter(env, redis);
