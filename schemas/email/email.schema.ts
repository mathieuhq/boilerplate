import { z } from "zod";

/**
 * Validates email sending parameters
 */
export const sendEmailSchema = z.object({
  html: z.string().optional(),
  text: z.string().optional(),
  from: z.email().optional(),
  replyTo: z.email().optional(),
  to: z.union([z.email(), z.array(z.email())]),
  subject: z.string().min(1, "Subject is required"),
  cc: z.union([z.email(), z.array(z.email())]).optional(),
  bcc: z.union([z.email(), z.array(z.email())]).optional(),
});

/**
 * Validates contact subscription parameters
 */
export const subscribeContactSchema = z.object({
  email: z.string().email("Valid email is required"),
  name: z.string().optional(),
});

/**
 * Validates contact unsubscription parameters
 */
export const unsubscribeContactSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export type SendEmailInput = z.infer<typeof sendEmailSchema>;
export type SubscribeContactInput = z.infer<typeof subscribeContactSchema>;
export type UnsubscribeContactInput = z.infer<typeof unsubscribeContactSchema>;
