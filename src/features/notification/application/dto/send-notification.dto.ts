import type {
  NotificationAudience,
  NotificationPayloads,
  NotificationType,
} from "../../domain/notification.types";

export type SendNotificationDTO = {
  [TType in NotificationType]: {
    audience: NotificationAudience;
    type: TType;
    data: NotificationPayloads[TType];
    link?: string;
    excludeUserIds?: string[];
  };
}[NotificationType];
