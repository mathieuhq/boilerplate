import type { SendEmailParams } from "../ports/email-provider.port";

export type EmailJobs = {
  "email.send": SendEmailParams;
};
