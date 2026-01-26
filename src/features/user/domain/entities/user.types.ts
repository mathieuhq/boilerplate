export type { Language } from "@/db/types";

export type NotificationPreferences = {
  social: boolean;
  security: boolean;
  marketing: boolean;
  communication: boolean;
  type: "ALL" | "NONE" | "MENTIONS";
};
