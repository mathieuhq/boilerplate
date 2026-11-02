import { z } from "zod";

import { updateNotificationPreferencesSchema } from "@/features/user/interface/schemas/user.schema";
import { Language } from "@/lib/generated/prisma/enums";
import { container } from "@/shared/infrastructure/di/container";

import { defineMcpTool } from "../tool";

const updateProfileInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  birthDate: z.iso.date().optional().describe("Birth date as YYYY-MM-DD"),
  language: z.enum(Language).optional(),
});

export const userTools = [
  defineMcpTool({
    name: "get_current_user",
    title: "Get current user",
    description:
      "Returns the profile and notification preferences of the signed-in user.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
    handler: async () => container.getUserController().getCurrentUserProfile(),
  }),
  defineMcpTool({
    name: "update_profile",
    title: "Update profile",
    description:
      "Updates the name, birth date or language of the signed-in user.",
    inputSchema: updateProfileInputSchema,
    annotations: { idempotentHint: true },
    handler: async ({ birthDate, ...input }, { user }) =>
      container.getUserController().updateUserProfile(user.id, {
        ...input,
        birthDate: birthDate ? new Date(birthDate) : undefined,
      }),
  }),
  defineMcpTool({
    name: "update_notification_preferences",
    title: "Update notification preferences",
    description:
      "Updates which email categories the signed-in user receives and the notification type.",
    inputSchema: updateNotificationPreferencesSchema,
    annotations: { idempotentHint: true },
    handler: async (input, { user }) =>
      container
        .getUserController()
        .updateNotificationPreferences(user.id, input),
  }),
];
