import { Entity } from "@/shared/domain/entity.base";

export type Attachment = {
  path?: string;
  contentType?: string;
  content?: string | Buffer;
  filename?: string | false | undefined;
};

export type EmailMessageProps = {
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

export class EmailMessage extends Entity<EmailMessageProps> {
  get to(): string | string[] {
    return this.props.to;
  }

  get from(): string {
    return this.props.from;
  }

  get subject(): string {
    return this.props.subject;
  }

  get html(): string {
    return this.props.html;
  }

  get text(): string | undefined {
    return this.props.text;
  }

  get replyTo(): string | undefined {
    return this.props.replyTo;
  }

  get cc(): string | string[] | undefined {
    return this.props.cc;
  }

  get bcc(): string | string[] | undefined {
    return this.props.bcc;
  }

  get attachments(): Attachment[] | undefined {
    return this.props.attachments;
  }
}
