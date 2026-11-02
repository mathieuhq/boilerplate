import type {
  IJobQueuePort,
  JobOptions,
  JobRequest,
} from "@/shared/application/ports/job-queue.port";

export type JobStore = {
  add: (
    name: string,
    data: unknown,
    options?: { jobId?: string; delay?: number },
  ) => Promise<unknown>;
};

export class BullMqJobQueueAdapter<TJobs> implements IJobQueuePort<TJobs> {
  constructor(private readonly store: JobStore) {}

  async enqueue(job: JobRequest<TJobs>, options?: JobOptions): Promise<void> {
    await this.store.add(job.name, job.payload, {
      jobId: options?.jobId,
      delay: options?.delayMs,
    });
  }
}
