import { describe, expect, it, vi } from "vitest";

import { Result } from "@/shared/application/result";

import type { INotificationStreamPort } from "../../application/ports/notification-publisher.port";
import type { DispatchNotificationUseCase } from "../../application/use-cases/dispatch-notification.use-case";
import type { ListNotificationsUseCase } from "../../application/use-cases/list-notifications.use-case";
import type { MarkAllNotificationsReadUseCase } from "../../application/use-cases/mark-all-notifications-read.use-case";
import type { MarkNotificationsReadUseCase } from "../../application/use-cases/mark-notifications-read.use-case";
import type { PurgeReadNotificationsUseCase } from "../../application/use-cases/purge-read-notifications.use-case";
import type { SendNotificationUseCase } from "../../application/use-cases/send-notification.use-case";
import { InvalidNotificationLinkError } from "../../domain/errors/invalid-notification-link.error";
import { NotificationController } from "../controllers/notification.controller";

const useCase = <T>(result: Result<unknown>) =>
  ({ execute: vi.fn().mockResolvedValue(result) }) as unknown as T;

const input = {
  audience: { kind: "users" as const, userIds: ["user-1"] },
  type: "system.message" as const,
  data: { title: "Hello" },
};

describe("NotificationController", () => {
  it("returns use case values and forwards the user id", async () => {
    const list = useCase<ListNotificationsUseCase>(
      Result.ok({ items: [], nextCursor: null, unreadCount: 0 }),
    );
    const markRead = useCase<MarkNotificationsReadUseCase>(
      Result.ok({ ids: ["n-1"] }),
    );
    const markAllRead = useCase<MarkAllNotificationsReadUseCase>(
      Result.ok({ count: 2 }),
    );
    const unsubscribe = vi.fn();
    const stream: INotificationStreamPort = {
      subscribe: vi.fn().mockReturnValue(unsubscribe),
    };
    const listener = vi.fn();
    const controller = new NotificationController(
      useCase<SendNotificationUseCase>(Result.ok({ queued: true })),
      useCase<DispatchNotificationUseCase>(Result.ok({ delivered: 1 })),
      list,
      markRead,
      markAllRead,
      useCase<PurgeReadNotificationsUseCase>(Result.ok({ deleted: 3 })),
      stream,
    );

    await expect(controller.send(input)).resolves.toEqual({ queued: true });
    await expect(controller.dispatch(input)).resolves.toEqual({
      delivered: 1,
    });
    await expect(
      controller.listNotifications("user-1", { limit: 20 }),
    ).resolves.toEqual({ items: [], nextCursor: null, unreadCount: 0 });
    await expect(controller.markRead("user-1", ["n-1"])).resolves.toEqual({
      ids: ["n-1"],
    });
    await expect(controller.markAllRead("user-1")).resolves.toEqual({
      count: 2,
    });
    await expect(controller.purgeRead()).resolves.toEqual({ deleted: 3 });
    expect(controller.subscribe("user-1", listener)).toBe(unsubscribe);
    expect(list.execute).toHaveBeenCalledWith({ userId: "user-1", limit: 20 });
    expect(markRead.execute).toHaveBeenCalledWith({
      userId: "user-1",
      ids: ["n-1"],
    });
    expect(markAllRead.execute).toHaveBeenCalledWith({ userId: "user-1" });
    expect(stream.subscribe).toHaveBeenCalledWith("user-1", listener);
  });

  it("throws use case failures", async () => {
    const error = new InvalidNotificationLinkError("https://evil.example.com");
    const failure = Result.fail(error);
    const controller = new NotificationController(
      useCase<SendNotificationUseCase>(failure),
      useCase<DispatchNotificationUseCase>(failure),
      useCase<ListNotificationsUseCase>(failure),
      useCase<MarkNotificationsReadUseCase>(failure),
      useCase<MarkAllNotificationsReadUseCase>(failure),
      useCase<PurgeReadNotificationsUseCase>(failure),
      { subscribe: vi.fn() },
    );

    await expect(controller.send(input)).rejects.toBe(error);
    await expect(controller.dispatch(input)).rejects.toBe(error);
    await expect(
      controller.listNotifications("user-1", { limit: 20 }),
    ).rejects.toBe(error);
    await expect(controller.markRead("user-1", ["n-1"])).rejects.toBe(error);
    await expect(controller.markAllRead("user-1")).rejects.toBe(error);
    await expect(controller.purgeRead()).rejects.toBe(error);
  });
});
