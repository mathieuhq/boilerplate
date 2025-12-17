import type { Attachment } from "../../domain/entities/email-message.entity";

export type SendEmailDTO = {
  to: string | string[];
  subject: string;
  html: string | React.ReactElement;
  from?: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Attachment[];
};

export type SendEmailResultDTO = {
  success: boolean;
  emailId?: string;
  error?: string;
};
