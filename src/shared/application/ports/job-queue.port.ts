export type JobOptions = {
  jobId?: string;
  delayMs?: number;
};

export type JobRequest<TJobs> = {
  [TName in keyof TJobs & string]: { name: TName; payload: TJobs[TName] };
}[keyof TJobs & string];

export type JobHandlers<TJobs> = {
  [TName in keyof TJobs]: (payload: TJobs[TName]) => Promise<unknown>;
};

export type IJobQueuePort<TJobs> = {
  enqueue: (job: JobRequest<TJobs>, options?: JobOptions) => Promise<void>;
};
