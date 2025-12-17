import { z } from "zod";

import { Language, NotificationType } from "@/lib/generated/prisma/enums";

export const userIdSchema = z.object({
  id: z.string().min(1, "User ID is required"),
});

export const supportedLanguages = Object.values(Language);

export const languageLabels: Record<
  (typeof Language)[keyof typeof Language],
  string
> = {
  [Language.KO]: "Korean",
  [Language.FR]: "French",
  [Language.DE]: "German",
  [Language.EN]: "English",
  [Language.ES]: "Spanish",
  [Language.RU]: "Russian",
  [Language.ZH]: "Chinese",
  [Language.JA]: "Japanese",
  [Language.PT]: "Portuguese",
};

export const updateUserProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  email: z.email("Invalid email format").optional(),
  image: z.url("Invalid image URL").optional(),
  birthDate: z.coerce
    .date()
    .max(new Date(), "Birth date must be in the past")
    .optional(),
  language: z.enum(Language).optional(),
});

export const listUsersQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const deleteUserConfirmationSchema = z.object({
  confirmation: z.boolean().refine((val) => val === true, {
    message: "You must confirm account deletion",
  }),
});

export const updateUserWithIdSchema = z.object({
  id: userIdSchema.shape.id,
  image: z.url().optional(),
  email: z.email().optional(),
  name: z.string().min(1).max(100).optional(),
});

export const updateNotificationPreferencesSchema = z.object({
  security_emails: z.boolean(),
  type: z.enum(NotificationType),
  social_emails: z.boolean().optional(),
  marketing_emails: z.boolean().optional(),
  communication_emails: z.boolean().optional(),
});

export type UserIdInput = z.infer<typeof userIdSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
export type ListUsersQueryInput = z.infer<typeof listUsersQuerySchema>;
export type DeleteUserConfirmationInput = z.infer<
  typeof deleteUserConfirmationSchema
>;
export type UpdateUserWithIdInput = z.infer<typeof updateUserWithIdSchema>;
export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;
