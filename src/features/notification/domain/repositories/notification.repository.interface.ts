import type { Notification, NotificationData } from "../notification.types";

export type CreateNotificationsInput = {
  userIds: string[];
  type: string;
  data: NotificationData;
  link: string | null;
};

export type ListNotificationsQuery = {
  userId: string;
  limit: number;
  cursor?: string;
};

export type NotificationPage = {
  items: Notification[];
  nextCursor: string | null;
};

export type INotificationRepository = {
  createMany: (input: CreateNotificationsInput) => Promise<Notification[]>;
  list: (query: ListNotificationsQuery) => Promise<NotificationPage>;
  countUnread: (userId: string) => Promise<number>;
  markRead: (userId: string, ids: string[], readAt: Date) => Promise<string[]>;
  markAllRead: (userId: string, readAt: Date) => Promise<number>;
  deleteReadBefore: (date: Date) => Promise<number>;
};
