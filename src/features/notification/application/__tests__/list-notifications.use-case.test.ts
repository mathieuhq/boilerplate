import { describe, expect, it, vi } from "vitest";

import { ListNotificationsUseCase } from "../use-cases/list-notifications.use-case";

import {
  createMockNotificationRepository,
  createNotification,
} from "./notification-repository.mock";

describe("ListNotificationsUseCase", () => {
  it("returns the page without user ids and the unread count", async () => {
    const repository = createMockNotificationRepository();
    const query = { userId: "user-1", limit: 20, cursor: "n-0" };
    vi.mocked(repository.list).mockResolvedValue({
      items: [createNotification({ link: "/settings" })],
      nextCursor: "n-1",
    });
    vi.mocked(repository.countUnread).mockResolvedValue(3);

    const result = await new ListNotificationsUseCase(repository).execute(
      query,
    );

    expect(result.value).toEqual({
      items: [
        {
          id: "notification-1",
          type: "system.message",
          data: { title: "Hello" },
          link: "/settings",
          readAt: null,
          createdAt: "2026-11-02T10:00:00.000Z",
        },
      ],
      nextCursor: "n-1",
      unreadCount: 3,
    });
    expect(repository.list).toHaveBeenCalledWith(query);
    expect(repository.countUnread).toHaveBeenCalledWith("user-1");
  });
});
