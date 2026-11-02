import type { SendNotificationDTO } from "../dto/send-notification.dto";

export type NotificationJobs = {
  "notification.dispatch": SendNotificationDTO;
  "notification.purge-read": Record<string, never>;
};
