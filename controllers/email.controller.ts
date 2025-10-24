import { emailService, type SendEmailParams } from "@/services/email";
import {
  sendEmailSchema,
  type SendEmailInput,
} from "@/schemas/email/email.schema";

export type { SendEmailInput };

/**
 * Email Controller
 *
 * @description
 * Controller layer for email-related operations.
 * Handles validation and delegates to EmailService.
 */
export class EmailController {
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
