import type { z } from "zod";

import type { JobHandlers } from "@/shared/application/ports/job-queue.port";
import { ApplicationError } from "@/shared/domain/errors/application.error";

export type ProcessableJob = {
  name: string;
  data: unknown;
};

export type JobSchemas<TJobs> = {
  [TName in keyof TJobs]: z.ZodType<TJobs[TName]>;
};

export class UnknownJobError extends ApplicationError {
  constructor(name: string) {
    super(`No handler is registered for the "${name}" job`);
    this.name = "UnknownJobError";
  }
}

export class InvalidJobDataError extends ApplicationError {
  constructor(name: string) {
    super(`The "${name}" job data is invalid`);
    this.name = "InvalidJobDataError";
  }
}

export function createJobProcessor<TJobs>(
  handlers: JobHandlers<TJobs>,
  schemas: JobSchemas<TJobs>,
) {
  return async (job: ProcessableJob) => {
    if (!Object.hasOwn(handlers, job.name)) throw new UnknownJobError(job.name);

    const name = job.name as keyof TJobs;
    const parsed = schemas[name].safeParse(job.data);

    if (!parsed.success) throw new InvalidJobDataError(job.name);

    return handlers[name](parsed.data);
  };
}
