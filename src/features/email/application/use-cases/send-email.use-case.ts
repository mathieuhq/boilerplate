import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";
import { pretty, render } from "@react-email/render";

import type { SendEmailDTO, SendEmailResultDTO } from "../dto/send-email.dto";
import type { IEmailProviderPort } from "../ports/email-provider.port";

export class SendEmailUseCase implements IUseCase<
  SendEmailDTO,
  SendEmailResultDTO
> {
  constructor(private readonly emailProvider: IEmailProviderPort) {}

  async execute(input: SendEmailDTO): Promise<Result<SendEmailResultDTO>> {
    let subject = input.subject;
    if (env.NODE_ENV === "development") {
      subject = `[DEV] ${subject}`;
    }

    let html = "";
    if (typeof input.html === "string") {
      html = input.html;
    } else {
      html = await pretty(await render(input.html));
    }

    const result = await this.emailProvider.send({
      to: input.to,
      from: input.from ?? env.EMAIL_FROM,
      subject,
      html,
      text: input.text,
      replyTo: input.replyTo,
      cc: input.cc,
      bcc: input.bcc,
      attachments: input.attachments,
    });

    if (result.error) {
      logger.error("[SendEmailUseCase] Error", {
        error: result.error,
        subject: input.subject,
      });
      return Result.ok({
        success: false,
        error: result.error.message,
      });
    }

    return Result.ok({
      success: true,
      emailId: result.data,
    });
  }
}
