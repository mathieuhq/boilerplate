import { type Processor, Queue, Worker } from "bullmq";
import Redis from "ioredis";

import { getRedisConfig } from "@/lib/env";
import { redis } from "@/lib/redis";
import { SITE_CONFIG } from "@/lib/site-config";

const JOB_QUEUE_NAME = "jobs";
const JOB_QUEUE_PREFIX = `@${SITE_CONFIG.APP_ID}/queue`;

const createQueue = () => {
  if (!redis) return null;

  return new Queue(JOB_QUEUE_NAME, {
    connection: redis,
    prefix: JOB_QUEUE_PREFIX,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 10_000 },
      removeOnComplete: { count: 1_000 },
      removeOnFail: { count: 5_000 },
    },
  });
};

const globalForQueue = globalThis as unknown as {
  jobQueue: Queue | null | undefined;
};

export const jobQueue =
  globalForQueue.jobQueue === undefined
    ? createQueue()
    : globalForQueue.jobQueue;

globalForQueue.jobQueue = jobQueue;

export function createJobWorker(processor: Processor) {
  const config = getRedisConfig();

  if (!config) return null;

  const connection = new Redis(config.url, { maxRetriesPerRequest: null });
  const worker = new Worker(JOB_QUEUE_NAME, processor, {
    connection,
    prefix: JOB_QUEUE_PREFIX,
    concurrency: 5,
  });

  return {
    worker,
    close: async () => {
      await worker.close();
      connection.disconnect();
    },
  };
}
