import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type { SendEmailDTO, SendEmailResultDTO } from "../dto/send-email.dto";
import type { IEmailProviderPort } from "../ports/email-provider.port";
import { renderEmailHtml } from "../services/render-email-html";

export class SendEmailUseCase implements IUseCase<
  SendEmailDTO,
  SendEmailResultDTO
> {
  constructor(private readonly emailProvider: IEmailProviderPort) {}

  async execute(input: SendEmailDTO): Promise<Result<SendEmailResultDTO>> {
    let subject = input.subject;

    if (env.NODE_ENV === "development") subject = `[DEV] ${subject}`;

    const html = await renderEmailHtml(input.html);

    const result = await this.emailProvider.send({
      html,
      subject,
      to: input.to,
      cc: input.cc,
      bcc: input.bcc,
      text: input.text,
      from: input.from,
      replyTo: input.replyTo,
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
