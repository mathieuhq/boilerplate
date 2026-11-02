import type { AuthJobs } from "@/features/auth/application/jobs/auth.jobs";
import type { EmailJobs } from "@/features/email/application/jobs/email.jobs";
import type { NotificationJobs } from "@/features/notification/application/jobs/notification.jobs";

export type AppJobs = EmailJobs & AuthJobs & NotificationJobs;

type JobSchedule = {
  [TName in keyof AppJobs]: {
    name: TName;
    pattern: string;
    data: AppJobs[TName];
  };
}[keyof AppJobs];

export const jobSchedules: JobSchedule[] = [
  { name: "auth.purge-expired-records", pattern: "0 3 * * *", data: {} },
  { name: "notification.purge-read", pattern: "30 3 * * *", data: {} },
];
