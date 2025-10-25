import { z } from "zod";

/**
 * Validates user ID
 */
export const userIdSchema = z.object({
  id: z.string().min(1, "User ID is required"),
});

/**
 * Supported languages for the application
 */
export const supportedLanguages = [
  "en",
  "fr",
  "de",
  "es",
  "pt",
  "ru",
  "ja",
  "ko",
  "zh",
] as const;

/**
 * Validates user profile updates
 */
export const updateUserProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  email: z.email("Invalid email format").optional(),
  image: z.url("Invalid image URL").optional(),
  birthDate: z.coerce
    .date()
    .max(new Date(), "Birth date must be in the past")
    .optional(),
  language: z.enum(supportedLanguages).optional(),
});

/**
 * Validates user list query parameters
 */
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
});

/**
 * Validates user deletion confirmation
 */
export const deleteUserConfirmationSchema = z.object({
  confirmation: z.boolean().refine((val) => val === true, {
    message: "You must confirm account deletion",
  }),
});

/**
 * Validates user updates with ID
 */
export const updateUserWithIdSchema = z.object({
  id: userIdSchema.shape.id,
  name: z.string().min(1).max(100).optional(),
  email: z.email().optional(),
  image: z.url().optional(),
});

/**
 * TypeScript types inferred from schemas
 */
export type UserIdInput = z.infer<typeof userIdSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
export type ListUsersQueryInput = z.infer<typeof listUsersQuerySchema>;
export type DeleteUserConfirmationInput = z.infer<
  typeof deleteUserConfirmationSchema
>;
export type UpdateUserWithIdInput = z.infer<typeof updateUserWithIdSchema>;
