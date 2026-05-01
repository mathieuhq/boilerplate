import { env } from "@/lib/env";
import { createRateLimiter } from "@/shared/infrastructure/rate-limit/rate-limiter";

export const ratelimit = createRateLimiter(env);
