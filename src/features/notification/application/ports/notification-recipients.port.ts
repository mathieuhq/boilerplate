import type { NotificationAudience } from "../../domain/notification.types";

export type INotificationRecipientsPort = {
  resolve: (audience: NotificationAudience) => Promise<string[]>;
};
