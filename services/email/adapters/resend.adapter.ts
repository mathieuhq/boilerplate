import type { User } from "better-auth";
import { Resend } from "resend";

import { env } from "@/lib/env";

import type { EmailParams, MailAdapter } from "./mail-adapter.interface";

/**
 * Email adapter using Resend API
 */
export class ResendAdapter implements MailAdapter {
  private readonly resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  /**
   * Sends an email via Resend
   */
  async send(
    params: EmailParams,
  ): Promise<{ error: null; data: string } | { error: Error; data: null }> {
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

  /**
   * Subscribes a contact to Resend audience
   * Returns the Resend contact ID
   */
  async subscribeContact(user: User): Promise<string | undefined> {
    if (!user.email) return;

    const contact = await this.resend.contacts.create({
      email: user.email,
      unsubscribed: false,
      firstName: user.name,
      audienceId: env.RESEND_AUDIENCE_ID,
    });

    if (!contact.data) return;

    return contact.data.id;
  }

  /**
   * Unsubscribes a contact from Resend audience
   * Accepts the Resend contact ID directly
   */
  async unsubscribeContact(
    resendContactId: string,
  ): Promise<string | undefined> {
    const contact = await this.resend.contacts.update({
      unsubscribed: true,
      id: resendContactId,
      audienceId: env.RESEND_AUDIENCE_ID,
    });

    if (!contact.data) return;

    return contact.data.id;
  }
}
