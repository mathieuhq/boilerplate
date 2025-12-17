import type { Attachment } from "../../domain/entities/email-message.entity";

export type SendEmailParams = {
  to: string | string[];
  from: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
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
  subscribeContact?: (contact: ContactInfo) => Promise<string | undefined>;
  unsubscribeContact?: (contactId: string) => Promise<string | undefined>;
};
