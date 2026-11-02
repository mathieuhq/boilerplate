import { beforeEach, describe, expect, it, vi } from "vitest";

import type { INotificationRepository } from "../../domain/repositories/notification.repository.interface";
import type { INotificationPublisherPort } from "../ports/notification-publisher.port";
import type { INotificationRecipientsPort } from "../ports/notification-recipients.port";
import { DispatchNotificationUseCase } from "../use-cases/dispatch-notification.use-case";

import {
  createMockNotificationPublisher,
  createMockNotificationRepository,
  createNotification,
} from "./notification-repository.mock";

describe("DispatchNotificationUseCase", () => {
  let recipients: INotificationRecipientsPort;
  let repository: INotificationRepository;
  let publisher: INotificationPublisherPort;
  let useCase: DispatchNotificationUseCase;

  beforeEach(() => {
    recipients = { resolve: vi.fn() };
    repository = createMockNotificationRepository();
    publisher = createMockNotificationPublisher();
    useCase = new DispatchNotificationUseCase(
      recipients,
      repository,
      publisher,
    );
  });

  it("stores one notification per unique recipient and pushes it in real time", async () => {
    const audience = { kind: "organization" as const, organizationId: "org-1" };
    const first = createNotification({ id: "n-1", userId: "user-1" });
    const second = createNotification({ id: "n-2", userId: "user-3" });
    vi.mocked(recipients.resolve).mockResolvedValue([
      "user-1",
      "user-2",
      "user-1",
      "user-3",
    ]);
    vi.mocked(repository.createMany).mockResolvedValue([first, second]);

    const result = await useCase.execute({
      audience,
      type: "system.message",
      data: { title: "Hello" },
      link: "/settings",
      excludeUserIds: ["user-2"],
    });

    expect(result.value).toEqual({ delivered: 2 });
    expect(recipients.resolve).toHaveBeenCalledWith(audience);
    expect(repository.createMany).toHaveBeenCalledWith({
      userIds: ["user-1", "user-3"],
      type: "system.message",
      data: { title: "Hello" },
      link: "/settings",
    });
    expect(publisher.publish).toHaveBeenCalledWith("user-1", {
      type: "notification.created",
      notification: {
        id: "n-1",
        type: "system.message",
        data: { title: "Hello" },
        link: null,
        readAt: null,
        createdAt: "2026-11-02T10:00:00.000Z",
      },
    });
    expect(publisher.publish).toHaveBeenCalledWith(
      "user-3",
      expect.objectContaining({ type: "notification.created" }),
    );
  });

  it("stores notifications without a link", async () => {
    vi.mocked(recipients.resolve).mockResolvedValue(["user-1"]);
    vi.mocked(repository.createMany).mockResolvedValue([createNotification()]);

    await useCase.execute({
      audience: { kind: "users", userIds: ["user-1"] },
      type: "system.message",
      data: { title: "Hello" },
    });

    expect(repository.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ link: null }),
    );
  });

  it("does nothing when nobody is left to notify", async () => {
    vi.mocked(recipients.resolve).mockResolvedValue(["user-1"]);

    const result = await useCase.execute({
      audience: { kind: "access", feature: "users", level: "read" },
      type: "system.message",
      data: { title: "Hello" },
      excludeUserIds: ["user-1"],
    });

    expect(result.value).toEqual({ delivered: 0 });
    expect(repository.createMany).not.toHaveBeenCalled();
    expect(publisher.publish).not.toHaveBeenCalled();
  });
});
