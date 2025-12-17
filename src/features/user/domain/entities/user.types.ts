export type { Language, NotificationType } from "@/lib/generated/prisma/enums";

export type NotificationPreferences = {
  type: "ALL" | "NONE" | "MENTIONS";
  social: boolean;
  security: boolean;
  marketing: boolean;
  communication: boolean;
};
