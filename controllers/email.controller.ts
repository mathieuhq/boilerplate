import {
  type SendEmailInput,
  sendEmailSchema,
  type SubscribeContactInput,
  subscribeContactSchema,
  type UnsubscribeContactInput,
  unsubscribeContactSchema,
} from "@/schemas/email/email.schema";
import {
  emailService,
  type SendEmailParams,
} from "@/services/email/email.service";
import { userService } from "@/services/user/user.service";

export type { SendEmailInput, SubscribeContactInput, UnsubscribeContactInput };

/**
 * Controller layer for email operations with validation
 */
class EmailController {
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
   * Orchestrates emailService and userService
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

    const user = await userService.getUserById(userId);

    if (!user)
      return {
        success: false,
        error: "User not found",
      };

    const resendContactId = await emailService.subscribeContact(user);

    if (!resendContactId)
      return {
        success: false,
        error: "Failed to subscribe contact",
      };

    // Update user with the Resend contact ID
    await userService.updateUser(userId, { resendContactId });

    return {
      success: true,
      data: resendContactId,
    };
  }

  /**
   * Unsubscribes a user from the email audience
   * Orchestrates emailService with user data from userService
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

    const user = await userService.getUserById(userId);

    if (!user)
      return {
        success: false,
        error: "User not found",
      };

    if (!user.resendContactId)
      return {
        success: false,
        error: "User is not subscribed to the email audience",
      };

    const result = await emailService.unsubscribeContact(user.resendContactId);

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
