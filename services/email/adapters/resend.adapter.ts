import type { User } from "better-auth";
import { Resend } from "resend";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import type { EmailParams, MailAdapter } from "./mail-adapter.interface";

export class ResendAdapter implements MailAdapter {
  private resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

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
