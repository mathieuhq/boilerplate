import {
  type SendEmailInput,
  sendEmailSchema,
} from "@/schemas/email/email.schema";
import { emailService, type SendEmailParams } from "@/services/email";

export type { SendEmailInput };

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
}

export const emailController = new EmailController();
