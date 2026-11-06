export type { Language } from "@/lib/enums";

export type NotificationPreferences = {
  social: boolean;
  security: boolean;
  marketing: boolean;
  communication: boolean;
  type: "ALL" | "NONE" | "MENTIONS";
};
