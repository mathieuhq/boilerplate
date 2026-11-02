import {
  InMemoryNotificationBroker,
  type NotificationBroker,
  RedisNotificationBroker,
} from "@/features/notification/infrastructure/adapters/notification-broker";
import { logger } from "@/lib/logger";
import { redis } from "@/lib/redis";
import { SITE_CONFIG } from "@/lib/site-config";

const reportError = (message: string, details: Record<string, unknown>) =>
  logger.warn(message, details);

const createNotificationBroker = (): NotificationBroker => {
  const client = redis;

  if (!client) return new InMemoryNotificationBroker(reportError);

  return new RedisNotificationBroker(
    client,
    () => client.duplicate(),
    `@${SITE_CONFIG.APP_ID}/notifications`,
    reportError,
  );
};

const globalForNotificationBroker = globalThis as unknown as {
  notificationBroker: NotificationBroker | undefined;
};

export const notificationBroker =
  globalForNotificationBroker.notificationBroker ?? createNotificationBroker();

globalForNotificationBroker.notificationBroker = notificationBroker;
