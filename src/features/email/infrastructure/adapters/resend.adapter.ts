import { Resend } from "resend";

import type {
  ContactInfo,
  IEmailProviderPort,
  SendEmailParams,
  SendEmailResult,
} from "../../application/ports/email-provider.port";

type ResendAdapterConfig = {
  from: string;
  apiKey: string;
  contactListId?: string;
};

export class ResendAdapter implements IEmailProviderPort {
  private readonly client: Resend;
  private readonly from: string;
  private readonly contactListId?: string;

  constructor(config: ResendAdapterConfig) {
    this.client = new Resend(config.apiKey);
    this.from = config.from;
    this.contactListId = config.contactListId;
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    try {
      const { data, error } = await this.client.emails.send({
        to: params.to,
        cc: params.cc,
        bcc: params.bcc,
        html: params.html,
        text: params.text,
        replyTo: params.replyTo,
        subject: params.subject,
        from: params.from ?? this.from,
        attachments: params.attachments,
      });

      if (error) return { data: null, error: new Error(error.message) };

      return { error: null, data: data.id };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error(String(error)),
        data: null,
      };
    }
  }

  async subscribeContact(contact: ContactInfo): Promise<string | undefined> {
    if (!contact.email) return;

    const segments = this.contactListId
      ? [{ id: this.contactListId }]
      : undefined;

    const created = await this.client.contacts.create({
      segments,
      email: contact.email,
      unsubscribed: false,
      firstName: contact.name,
    });

    if (created.data) return created.data.id;

    const updated = await this.client.contacts.update({
      email: contact.email,
      unsubscribed: false,
    });

    if (!updated.data) return;

    if (this.contactListId)
      await this.client.contacts.segments.add({
        contactId: updated.data.id,
        segmentId: this.contactListId,
      });

    return updated.data.id;
  }

  async unsubscribeContact(contactId: string): Promise<string | undefined> {
    const { data } = await this.client.contacts.update({
      id: contactId,
      unsubscribed: true,
    });

    return data?.id;
  }

  async deleteContact(contactId: string): Promise<boolean> {
    const { error } = await this.client.contacts.remove(contactId);

    return !error;
  }
}
