import type { User } from "better-auth";

export type EmailParams = {
  from: string;
  html: string;
  text?: string;
  subject: string;
  replyTo?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Attachment[];
};

export type Attachment = {
  path?: string;
  contentType?: string;
  content?: string | Buffer;
  filename?: string | false | undefined;
};

export type MailAdapter = {
  send: (params: EmailParams) => Promise<
    | {
        error: null;
        data: string;
      }
    | {
        error: Error;
        data: null;
      }
  >;
  createContact?: (user: User) => Promise<string | undefined>;
};
