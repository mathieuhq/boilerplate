import { SITE_CONFIG } from "@/lib/site-config";
import { HttpError } from "@/shared/domain/errors/http.error";
import { getRateLimitEnvConfig } from "@/shared/infrastructure/env/env-config";
import { HttpStatus } from "@/shared/infrastructure/http/http-status";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
};

type RateLimitEnv = {
  NODE_ENV?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
};

export type RateLimiter = {
  limit: (identifier: string) => Promise<RateLimitResult>;
};

export function createRateLimiter(env: RateLimitEnv): RateLimiter {
  const redisConfig = getRateLimitEnvConfig(env);

  if (redisConfig) {
    const redis = new Redis({
      url: redisConfig.url,
      token: redisConfig.token,
    });

    return new Ratelimit({
      redis,
      analytics: true,
      prefix: `@${SITE_CONFIG.APP_ID}/ratelimit`,
      limiter: Ratelimit.slidingWindow(100, "60 s"),
    });
  }

  if (env.NODE_ENV === "production")
    return {
      async limit() {
        throw new HttpError(
          "UPSTASH_REDIS_NOT_CONFIGURED",
          "Upstash Redis is not configured",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      },
    };

  return {
    async limit() {
      return {
        success: true,
        limit: Number.MAX_SAFE_INTEGER,
        remaining: Number.MAX_SAFE_INTEGER,
      };
    },
  };
}
