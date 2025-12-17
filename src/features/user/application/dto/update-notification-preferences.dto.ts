import type { NotificationPreferences } from "../../domain/entities/user.types";

export type UpdateNotificationPreferencesDTO = {
  userId: string;
  social?: boolean;
  security?: boolean;
  marketing?: boolean;
  communication?: boolean;
  type?: NotificationPreferences["type"];
};
