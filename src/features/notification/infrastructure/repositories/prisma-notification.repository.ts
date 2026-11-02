import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";

import type {
  Notification,
  NotificationData,
} from "../../domain/notification.types";
import type {
  CreateNotificationsInput,
  INotificationRepository,
  ListNotificationsQuery,
  NotificationPage,
} from "../../domain/repositories/notification.repository.interface";

type PrismaNotification = {
  id: string;
  userId: string;
  type: string;
  data: Prisma.JsonValue;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createMany(input: CreateNotificationsInput): Promise<Notification[]> {
    const notifications = await this.prisma.notification.createManyAndReturn({
      data: input.userIds.map((userId) => ({
        userId,
        type: input.type,
        data: input.data as Prisma.InputJsonObject,
        link: input.link,
      })),
    });

    return notifications.map(toNotification);
  }

  async list(query: ListNotificationsQuery): Promise<NotificationPage> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId: query.userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const items = notifications.slice(0, query.limit).map(toNotification);
    const hasMore = notifications.length > query.limit;

    return { items, nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null };
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(
    userId: string,
    ids: string[],
    readAt: Date,
  ): Promise<string[]> {
    const unread = await this.prisma.notification.findMany({
      where: { id: { in: ids }, userId, readAt: null },
      select: { id: true },
    });
    const unreadIds = unread.map((notification) => notification.id);

    if (unreadIds.length === 0) return [];

    await this.prisma.notification.updateMany({
      where: { id: { in: unreadIds }, userId, readAt: null },
      data: { readAt },
    });

    return unreadIds;
  }

  async markAllRead(userId: string, readAt: Date): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt },
    });

    return result.count;
  }

  async deleteReadBefore(date: Date): Promise<number> {
    const result = await this.prisma.notification.deleteMany({
      where: { readAt: { lt: date } },
    });

    return result.count;
  }
}

function toNotificationData(data: Prisma.JsonValue): NotificationData {
  if (!data || Array.isArray(data) || typeof data !== "object") return {};

  return data as NotificationData;
}

function toNotification(notification: PrismaNotification): Notification {
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    data: toNotificationData(notification.data),
    link: notification.link,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  };
}
