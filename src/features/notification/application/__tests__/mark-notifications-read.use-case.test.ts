import { describe, expect, it, vi } from "vitest";

import { MarkAllNotificationsReadUseCase } from "../use-cases/mark-all-notifications-read.use-case";
import { MarkNotificationsReadUseCase } from "../use-cases/mark-notifications-read.use-case";

import {
  createMockNotificationPublisher,
  createMockNotificationRepository,
} from "./notification-repository.mock";

const now = new Date("2026-11-02T12:00:00.000Z");

describe("MarkNotificationsReadUseCase", () => {
  it("marks unique ids as read and syncs the user's other tabs", async () => {
    const repository = createMockNotificationRepository();
    const publisher = createMockNotificationPublisher();
    vi.mocked(repository.markRead).mockResolvedValue(["n-1"]);

    const result = await new MarkNotificationsReadUseCase(
      repository,
      publisher,
      () => now,
    ).execute({ userId: "user-1", ids: ["n-1", "n-2", "n-1"] });

    expect(result.value).toEqual({ ids: ["n-1"] });
    expect(repository.markRead).toHaveBeenCalledWith(
      "user-1",
      ["n-1", "n-2"],
      now,
    );
    expect(publisher.publish).toHaveBeenCalledWith("user-1", {
      type: "notification.read",
      ids: ["n-1"],
    });
  });

  it("does not publish when nothing changed", async () => {
    vi.useFakeTimers({ now });
    const repository = createMockNotificationRepository();
    const publisher = createMockNotificationPublisher();
    vi.mocked(repository.markRead).mockResolvedValue([]);

    const result = await new MarkNotificationsReadUseCase(
      repository,
      publisher,
    ).execute({ userId: "user-1", ids: ["n-1"] });

    expect(result.value).toEqual({ ids: [] });
    expect(repository.markRead).toHaveBeenCalledWith("user-1", ["n-1"], now);
    expect(publisher.publish).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe("MarkAllNotificationsReadUseCase", () => {
  it("marks every unread notification and syncs the user's other tabs", async () => {
    const repository = createMockNotificationRepository();
    const publisher = createMockNotificationPublisher();
    vi.mocked(repository.markAllRead).mockResolvedValue(4);

    const result = await new MarkAllNotificationsReadUseCase(
      repository,
      publisher,
      () => now,
    ).execute({ userId: "user-1" });

    expect(result.value).toEqual({ count: 4 });
    expect(repository.markAllRead).toHaveBeenCalledWith("user-1", now);
    expect(publisher.publish).toHaveBeenCalledWith("user-1", {
      type: "notification.read-all",
    });
  });

  it("does not publish when everything was already read", async () => {
    vi.useFakeTimers({ now });
    const repository = createMockNotificationRepository();
    const publisher = createMockNotificationPublisher();
    vi.mocked(repository.markAllRead).mockResolvedValue(0);

    const result = await new MarkAllNotificationsReadUseCase(
      repository,
      publisher,
    ).execute({ userId: "user-1" });

    expect(result.value).toEqual({ count: 0 });
    expect(repository.markAllRead).toHaveBeenCalledWith("user-1", now);
    expect(publisher.publish).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
