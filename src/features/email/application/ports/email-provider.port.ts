import type { Attachment } from "../../domain/entities/email-message.entity";

export type SendEmailParams = {
  html: string;
  from?: string;
  text?: string;
  subject: string;
  replyTo?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Attachment[];
};

export type SendEmailResult =
  | { error: null; data: string }
  | { error: Error; data: null };

export type ContactInfo = {
  email: string;
  name?: string;
};

export type IEmailProviderPort = {
  send: (params: SendEmailParams) => Promise<SendEmailResult>;
  unsubscribeContact?: (contactId: string) => Promise<string | undefined>;
  subscribeContact?: (contact: ContactInfo) => Promise<string | undefined>;
};
