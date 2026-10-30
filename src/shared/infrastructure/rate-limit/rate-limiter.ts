import { SITE_CONFIG } from "@/lib/site-config";
import { HttpError } from "@/shared/domain/errors/http.error";
import { HttpStatus } from "@/shared/infrastructure/http/http-status";

const LIMIT = 100;
const WINDOW_MS = 60_000;
const KEY_PREFIX = `@${SITE_CONFIG.APP_ID}/ratelimit`;

const SLIDING_WINDOW_SCRIPT = `
local current = tonumber(redis.call("GET", KEYS[1]) or "0")
local previous = tonumber(redis.call("GET", KEYS[2]) or "0")
local limit = tonumber(ARGV[1])
local elapsed = tonumber(ARGV[2])
local window = tonumber(ARGV[3])
local used = math.floor(previous * (1 - elapsed)) + current

if used >= limit then
  return -1
end

if redis.call("INCR", KEYS[1]) == 1 then
  redis.call("PEXPIRE", KEYS[1], window * 2)
end

return limit - used - 1
`;

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
};

export type RateLimitStore = {
  eval: (
    script: string,
    numberOfKeys: number,
    ...args: (number | string)[]
  ) => Promise<unknown>;
};

type RateLimitEnv = {
  NODE_ENV?: string;
};

type RateLimiter = {
  limit: (identifier: string) => Promise<RateLimitResult>;
};

export function createRateLimiter(
  env: RateLimitEnv,
  store: RateLimitStore | null,
  now: () => number = Date.now,
): RateLimiter {
  if (store)
    return {
      async limit(identifier) {
        const timestamp = now();
        const window = Math.floor(timestamp / WINDOW_MS);
        const elapsed = (timestamp % WINDOW_MS) / WINDOW_MS;

        const remaining = Number(
          await store.eval(
            SLIDING_WINDOW_SCRIPT,
            2,
            `${KEY_PREFIX}:${identifier}:${window}`,
            `${KEY_PREFIX}:${identifier}:${window - 1}`,
            LIMIT,
            elapsed,
            WINDOW_MS,
          ),
        );

        return {
          limit: LIMIT,
          success: remaining >= 0,
          remaining: Math.max(remaining, 0),
        };
      },
    };

  if (env.NODE_ENV === "production")
    return {
      async limit() {
        throw new HttpError(
          "REDIS_NOT_CONFIGURED",
          "Redis is not configured",
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
