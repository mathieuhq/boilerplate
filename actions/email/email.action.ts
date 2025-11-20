"use server";

import { emailController } from "@/controllers/email.controller";
import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { logger } from "@/lib/logger";
import { sendEmailSchema } from "@/schemas/email/email.schema";

/**
 * Server action to send an email
 */
export const postEmailAction = authAction
  .inputSchema(sendEmailSchema)
  .action(async ({ parsedInput, ctx }) => {
    logger.info(`Sending email from user ${ctx.user.id}`, {
      to: parsedInput.to,
      subject: parsedInput.subject,
    });

    const result = await emailController.sendEmail(parsedInput);

    if (!result.success) {
      const errorMessage = result.error ?? "Failed to send email";
      logger.error("Failed to send email", {
        error: errorMessage,
        userId: ctx.user.id,
      });

      throw new ApplicationError(errorMessage);
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

/**
 * Server action to subscribe the current user to email audience
 */
export const subscribeContactAction = authAction.action(async ({ ctx }) => {
  logger.info(`Subscribing user ${ctx.user.id} to email audience`);

  const result = await emailController.subscribeContact({
    userId: ctx.user.id,
  });

  if (!result.success) {
    const errorMessage = result.error ?? "Failed to subscribe contact";
    logger.error("Failed to subscribe contact", {
      error: errorMessage,
      userId: ctx.user.id,
    });

    throw new ApplicationError(errorMessage);
  }

  logger.info("Contact subscribed successfully", {
    userId: ctx.user.id,
    contactId: result.data,
  });

  return {
    success: true,
    contactId: result.data,
  };
});

/**
 * Server action to unsubscribe the current user from email audience
 */
export const unsubscribeContactAction = authAction.action(async ({ ctx }) => {
  logger.info(`Unsubscribing user ${ctx.user.id} from email audience`);

  const result = await emailController.unsubscribeContact({
    userId: ctx.user.id,
  });

  if (!result.success) {
    const errorMessage = result.error ?? "Failed to unsubscribe contact";
    logger.error("Failed to unsubscribe contact", {
      error: errorMessage,
      userId: ctx.user.id,
    });

    throw new ApplicationError(errorMessage);
  }

  logger.info("Contact unsubscribed successfully", {
    userId: ctx.user.id,
    contactId: result.data,
  });

  return {
    success: true,
    contactId: result.data,
  };
});
