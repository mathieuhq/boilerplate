import Redis from "ioredis";

import { getRedisConfig } from "@/lib/env";
import { logger } from "@/lib/logger";

const createRedis = () => {
  const config = getRedisConfig();

  if (!config) return null;

  const client = new Redis(config.url, {
    connectTimeout: 5_000,
    maxRetriesPerRequest: 2,
  });

  client.on("error", (error) => {
    logger.error("Redis connection error", { error: error.message });
  });

  return client;
};

const globalForRedis = globalThis as unknown as {
  redis: Redis | null | undefined;
};

export const redis =
  globalForRedis.redis === undefined ? createRedis() : globalForRedis.redis;

globalForRedis.redis = redis;
