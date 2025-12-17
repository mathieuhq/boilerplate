export type { Language, NotificationType } from "@/lib/generated/prisma/enums";

export type NotificationPreferences = {
  social: boolean;
  security: boolean;
  marketing: boolean;
  communication: boolean;
  type: "ALL" | "NONE" | "MENTIONS";
};
