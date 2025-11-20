import { db } from "@/lib/db";
import {
  type SendEmailInput,
  sendEmailSchema,
  type SubscribeContactInput,
  subscribeContactSchema,
  type UnsubscribeContactInput,
  unsubscribeContactSchema,
} from "@/schemas/email/email.schema";
import { emailService, type SendEmailParams } from "@/services/email";

export type { SendEmailInput, SubscribeContactInput, UnsubscribeContactInput };

/**
 * Controller layer for email operations with validation
 */
export class EmailController {
  /**
   * Sends an email
   */
  async sendEmail(input: unknown) {
    const validationResult = sendEmailSchema.safeParse(input);

    if (!validationResult.success)
      return {
        success: false,
        error: "Validation failed",
        details: validationResult.error.issues,
      };

    const params = validationResult.data;

    const result = await emailService.sendEmail(params as SendEmailParams);

    if (result.error)
      return {
        success: false,
        error: result.error.message,
      };

    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * Subscribes a user to the email audience
   */
  async subscribeContact(input: unknown) {
    const validationResult = subscribeContactSchema.safeParse(input);

    if (!validationResult.success)
      return {
        success: false,
        error: "Validation failed",
        details: validationResult.error.issues,
      };

    const { userId } = validationResult.data;

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user)
      return {
        success: false,
        error: "User not found",
      };

    const result = await emailService.subscribeContact(user);

    if (!result)
      return {
        success: false,
        error: "Failed to subscribe contact",
      };

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Unsubscribes a user from the email audience
   */
  async unsubscribeContact(input: unknown) {
    const validationResult = unsubscribeContactSchema.safeParse(input);

    if (!validationResult.success)
      return {
        success: false,
        error: "Validation failed",
        details: validationResult.error.issues,
      };

    const { userId } = validationResult.data;

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user)
      return {
        success: false,
        error: "User not found",
      };

    const result = await emailService.unsubscribeContact(user);

    if (!result)
      return {
        success: false,
        error: "Failed to unsubscribe contact",
      };

    return {
      success: true,
      data: result,
    };
  }
}

export const emailController = new EmailController();
