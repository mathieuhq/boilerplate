import type { AuthJobs } from "@/features/auth/application/jobs/auth.jobs";
import type { EmailJobs } from "@/features/email/application/jobs/email.jobs";

export type AppJobs = EmailJobs & AuthJobs;

type JobSchedule = {
  [TName in keyof AppJobs]: {
    name: TName;
    pattern: string;
    data: AppJobs[TName];
  };
}[keyof AppJobs];

export const jobSchedules: JobSchedule[] = [
  { name: "auth.purge-expired-records", pattern: "0 3 * * *", data: {} },
];
