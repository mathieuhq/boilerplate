import type { JobHandlers } from "@/shared/application/ports/job-queue.port";
import { ApplicationError } from "@/shared/domain/errors/application.error";

export type ProcessableJob = {
  name: string;
  data: unknown;
};

export class UnknownJobError extends ApplicationError {
  constructor(name: string) {
    super(`No handler is registered for the "${name}" job`);
    this.name = "UnknownJobError";
  }
}

export function createJobProcessor<TJobs>(handlers: JobHandlers<TJobs>) {
  return async (job: ProcessableJob) => {
    if (!Object.hasOwn(handlers, job.name)) throw new UnknownJobError(job.name);

    const name = job.name as keyof TJobs;

    return handlers[name](job.data as TJobs[typeof name]);
  };
}
