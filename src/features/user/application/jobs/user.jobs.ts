export type UserJobs = {
  "user.export-data": { exportId: string };
  "user.purge-expired-data-exports": Record<string, never>;
};
