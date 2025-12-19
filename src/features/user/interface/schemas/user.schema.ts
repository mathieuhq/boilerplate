import { z } from "zod";

import { Language, NotificationType } from "@/lib/generated/prisma/enums";

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
  image: z.string().optional(),
  birthDate: z.coerce
    .date()
    .max(new Date(), "Birth date must be in the past")
    .optional(),
  language: z.enum(Language).optional(),
});

export const updateNotificationPreferencesSchema = z.object({
  security_emails: z.boolean(),
  type: z.enum(NotificationType),
  social_emails: z.boolean().optional(),
  marketing_emails: z.boolean().optional(),
  communication_emails: z.boolean().optional(),
});
