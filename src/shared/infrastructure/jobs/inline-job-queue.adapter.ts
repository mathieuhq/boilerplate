import type {
  IJobQueuePort,
  JobRequest,
} from "@/shared/application/ports/job-queue.port";

import type { ProcessableJob } from "./job-processor";

export class InlineJobQueueAdapter<TJobs> implements IJobQueuePort<TJobs> {
  constructor(
    private readonly process: (job: ProcessableJob) => Promise<unknown>,
  ) {}

  async enqueue(job: JobRequest<TJobs>): Promise<void> {
    await this.process({ name: job.name, data: job.payload });
  }
}
