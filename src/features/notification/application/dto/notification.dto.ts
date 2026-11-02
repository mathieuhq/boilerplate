import type {
  Notification,
  NotificationData,
} from "../../domain/notification.types";

export type NotificationDTO = {
  id: string;
  type: string;
  data: NotificationData;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationListDTO = {
  items: NotificationDTO[];
  nextCursor: string | null;
  unreadCount: number;
};

export function toNotificationDTO(notification: Notification): NotificationDTO {
  return {
    id: notification.id,
    type: notification.type,
    data: notification.data,
    link: notification.link,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
  };
}
