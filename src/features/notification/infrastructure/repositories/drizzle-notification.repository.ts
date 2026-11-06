import { and, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";

import type { Database } from "@/lib/db";
import { notification } from "@/lib/schema";

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

export class DrizzleNotificationRepository implements INotificationRepository {
  constructor(private readonly db: Database) {}

  async createMany(input: CreateNotificationsInput): Promise<Notification[]> {
    if (input.userIds.length === 0) return [];

    const notifications = await this.db
      .insert(notification)
      .values(
        input.userIds.map((userId) => ({
          userId,
          type: input.type,
          data: input.data,
          link: input.link,
        })),
      )
      .returning();

    return notifications.map(toNotification);
  }

  async list(query: ListNotificationsQuery): Promise<NotificationPage> {
    const notifications = await this.db
      .select()
      .from(notification)
      .where(
        and(
          eq(notification.userId, query.userId),
          query.cursor
            ? sql`(${notification.createdAt}, ${notification.id}) < (select ${notification.createdAt}, ${notification.id} from ${notification} where ${notification.id} = ${query.cursor})`
            : undefined,
        ),
      )
      .orderBy(desc(notification.createdAt), desc(notification.id))
      .limit(query.limit + 1);

    const items = notifications.slice(0, query.limit).map(toNotification);
    const hasMore = notifications.length > query.limit;

    return { items, nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null };
  }

  async countUnread(userId: string): Promise<number> {
    return this.db.$count(
      notification,
      and(eq(notification.userId, userId), isNull(notification.readAt)),
    );
  }

  async markRead(
    userId: string,
    ids: string[],
    readAt: Date,
  ): Promise<string[]> {
    if (ids.length === 0) return [];

    const updated = await this.db
      .update(notification)
      .set({ readAt })
      .where(
        and(
          inArray(notification.id, ids),
          eq(notification.userId, userId),
          isNull(notification.readAt),
        ),
      )
      .returning({ id: notification.id });

    return updated.map((row) => row.id);
  }

  async markAllRead(userId: string, readAt: Date): Promise<number> {
    const updated = await this.db
      .update(notification)
      .set({ readAt })
      .where(and(eq(notification.userId, userId), isNull(notification.readAt)))
      .returning({ id: notification.id });

    return updated.length;
  }

  async deleteReadBefore(date: Date): Promise<number> {
    const deleted = await this.db
      .delete(notification)
      .where(lt(notification.readAt, date))
      .returning({ id: notification.id });

    return deleted.length;
  }
}

function toNotificationData(data: unknown): NotificationData {
  if (!data || Array.isArray(data) || typeof data !== "object") return {};

  return data as NotificationData;
}

function toNotification(row: typeof notification.$inferSelect): Notification {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    data: toNotificationData(row.data),
    link: row.link,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
