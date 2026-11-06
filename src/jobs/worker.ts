import { definePlugin } from "nitro";

import { logger } from "@/lib/logger";
import { createJobWorker, jobQueue } from "@/lib/queue";
import { container } from "@/shared/infrastructure/di/container";
import { createJobProcessor } from "@/shared/infrastructure/jobs/job-processor";

import { jobSchemas } from "./job-schemas";
import { jobSchedules } from "./jobs";

export default definePlugin((nitroApp) => {
  const queue = jobQueue;
  const jobWorker = createJobWorker(
    createJobProcessor(container.getJobHandlers(), jobSchemas),
  );

  if (!queue || !jobWorker) {
    logger.warn(
      "Redis is not configured: jobs run inline and schedules are disabled",
    );

    return;
  }

  jobWorker.worker.on("failed", (job, error) => {
    logger.error("Job failed", {
      jobId: job?.id,
      name: job?.name,
      error: error.message,
      attempt: job?.attemptsMade,
    });
  });

  jobWorker.worker.on("error", (error) => {
    logger.error("Job worker error", { error: error.message });
  });

  Promise.all(
    jobSchedules.map(async (schedule) =>
      queue.upsertJobScheduler(
        schedule.name,
        { pattern: schedule.pattern },
        { name: schedule.name, data: schedule.data },
      ),
    ),
  ).catch((error: unknown) => {
    logger.error("Failed to register job schedules", { error });
  });

  nitroApp.hooks.hook("close", async () => {
    await jobWorker.close();
    await queue.close();
  });
});
