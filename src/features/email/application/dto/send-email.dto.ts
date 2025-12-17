import type { Attachment } from "../../domain/entities/email-message.entity";

export type SendEmailDTO = {
  from?: string;
  text?: string;
  subject: string;
  replyTo?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Attachment[];
  html: string | React.ReactElement;
};

export type SendEmailResultDTO = {
  error?: string;
  emailId?: string;
  success: boolean;
};
