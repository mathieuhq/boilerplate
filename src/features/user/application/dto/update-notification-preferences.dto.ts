import type { NotificationPreferences } from "../../domain/entities/user.types";

export type UpdateNotificationPreferencesDTO = {
  userId: string;
  type?: NotificationPreferences["type"];
  social?: boolean;
  security?: boolean;
  marketing?: boolean;
  communication?: boolean;
};
