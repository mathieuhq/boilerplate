import type { User } from "better-auth";
import { Resend } from "resend";

import { db } from "@/lib/db";
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
   * Creates a contact in Resend audience
   */
  async createContact(user: User): Promise<string | undefined> {
    if (!user.email) return;

    const contact = await this.resend.contacts.create({
      email: user.email,
      unsubscribed: false,
      firstName: user.name,
      audienceId: env.RESEND_AUDIENCE_ID,
    });

    if (!contact.data) return;

    await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        resendContactId: contact.data.id,
      },
    });

    return contact.data.id;
  }
}
