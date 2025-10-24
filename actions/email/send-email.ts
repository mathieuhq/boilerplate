"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { logger } from "@/lib/logger";
import { sendEmailSchema } from "@/schemas/email/email.schema";
import { emailService } from "@/services/email";

/**
 * Send an email
 *
 * @description
 * Server Action to send emails.
 * Requires authentication.
 *
 * @example
 * ```ts
 * const { data, serverError } = await sendEmailAction({
 *   to: "recipient@example.com",
 *   subject: "Hello",
 *   html: "<p>Hello World</p>",
 *   text: "Hello World"
 * });
 * ```
 */
export const postEmailAction = authAction
  .inputSchema(sendEmailSchema)
  .action(async ({ parsedInput, ctx }) => {
    logger.info(`Sending email from user ${ctx.user.id}`, {
      to: parsedInput.to,
      subject: parsedInput.subject,
    });

    const result = await emailService.sendEmail(parsedInput);

    if (result.error) {
      logger.error("Failed to send email", {
        error: result.error.message,
        userId: ctx.user.id,
      });

      throw new ApplicationError(result.error.message);
    }

    logger.info("Email sent successfully", {
      userId: ctx.user.id,
      emailId: result.data,
    });

    return {
      success: true,
      emailId: result.data,
    };
  });
