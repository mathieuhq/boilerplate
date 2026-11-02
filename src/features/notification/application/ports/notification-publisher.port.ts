import type { NotificationDTO } from "../dto/notification.dto";

export type NotificationEvent =
  | { type: "notification.created"; notification: NotificationDTO }
  | { type: "notification.read"; ids: string[] }
  | { type: "notification.read-all" };

export type NotificationListener = (event: NotificationEvent) => void;

export type INotificationPublisherPort = {
  publish: (userId: string, event: NotificationEvent) => Promise<void>;
};

export type INotificationStreamPort = {
  subscribe: (userId: string, listener: NotificationListener) => () => void;
};
