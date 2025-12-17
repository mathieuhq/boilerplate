import { Resend } from "resend";

import { env } from "@/lib/env";

import type {
  ContactInfo,
  IEmailProviderPort,
  SendEmailParams,
  SendEmailResult,
} from "../../application/ports/email-provider.port";

export class ResendAdapter implements IEmailProviderPort {
  private readonly resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    try {
      const result = await this.resend.emails.send({
        to: params.to,
        cc: params.cc,
        bcc: params.bcc,
        from: params.from,
        html: params.html,
        text: params.text,
        subject: params.subject,
        replyTo: params.replyTo,
        attachments: params.attachments,
      });

      if (result.error)
        return {
          data: null,
          error: new Error(result.error.message),
        };

      return {
        error: null,
        data: result.data.id,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error(String(error)),
        data: null,
      };
    }
  }

  async subscribeContact(contact: ContactInfo): Promise<string | undefined> {
    if (!contact.email) return;

    const result = await this.resend.contacts.create({
      unsubscribed: false,
      email: contact.email,
      firstName: contact.name,
      audienceId: env.RESEND_AUDIENCE_ID,
    });

    if (!result.data) return;

    return result.data.id;
  }

  async unsubscribeContact(contactId: string): Promise<string | undefined> {
    const result = await this.resend.contacts.update({
      id: contactId,
      unsubscribed: true,
      audienceId: env.RESEND_AUDIENCE_ID,
    });

    if (!result.data) return;

    return result.data.id;
  }
}
