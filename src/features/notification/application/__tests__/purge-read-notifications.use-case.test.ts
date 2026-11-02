import { describe, expect, it, vi } from "vitest";

import { PurgeReadNotificationsUseCase } from "../use-cases/purge-read-notifications.use-case";

import { createMockNotificationRepository } from "./notification-repository.mock";

describe("PurgeReadNotificationsUseCase", () => {
  it("deletes notifications read more than 90 days ago", async () => {
    const repository = createMockNotificationRepository();
    vi.mocked(repository.deleteReadBefore).mockResolvedValue(12);

    const result = await new PurgeReadNotificationsUseCase(
      repository,
      () => new Date("2026-11-02T03:30:00.000Z"),
    ).execute({});

    expect(result.value).toEqual({ deleted: 12 });
    expect(repository.deleteReadBefore).toHaveBeenCalledWith(
      new Date("2026-08-04T03:30:00.000Z"),
    );
  });

  it("uses the current time by default", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-02T03:30:00.000Z") });
    const repository = createMockNotificationRepository();
    vi.mocked(repository.deleteReadBefore).mockResolvedValue(0);

    await new PurgeReadNotificationsUseCase(repository).execute({});

    expect(repository.deleteReadBefore).toHaveBeenCalledWith(
      new Date("2026-08-04T03:30:00.000Z"),
    );
    vi.useRealTimers();
  });
});
