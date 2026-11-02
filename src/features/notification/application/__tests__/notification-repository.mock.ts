import { vi } from "vitest";

import type { Notification } from "../../domain/notification.types";
import type { INotificationRepository } from "../../domain/repositories/notification.repository.interface";
import type { INotificationPublisherPort } from "../ports/notification-publisher.port";

export function createMockNotificationRepository(): INotificationRepository {
  return {
    createMany: vi.fn(),
    list: vi.fn(),
    countUnread: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    deleteReadBefore: vi.fn(),
  };
}

export function createMockNotificationPublisher(): INotificationPublisherPort {
  return { publish: vi.fn().mockResolvedValue(undefined) };
}

export function createNotification(
  overrides: Partial<Notification> = {},
): Notification {
  return {
    id: "notification-1",
    userId: "user-1",
    type: "system.message",
    data: { title: "Hello" },
    link: null,
    readAt: null,
    createdAt: "2026-11-02T10:00:00.000Z",
    ...overrides,
  };
}
