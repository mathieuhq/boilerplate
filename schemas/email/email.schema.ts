import { z } from "zod";

/**
 * Validates email sending parameters
 */
export const sendEmailSchema = z.object({
  to: z.union([z.email(), z.array(z.email())]),
  subject: z.string().min(1, "Subject is required"),
  html: z.string().optional(),
  text: z.string().optional(),
  from: z.email().optional(),
  replyTo: z.email().optional(),
  cc: z.union([z.email(), z.array(z.email())]).optional(),
  bcc: z.union([z.email(), z.array(z.email())]).optional(),
});

export type SendEmailInput = z.infer<typeof sendEmailSchema>;
