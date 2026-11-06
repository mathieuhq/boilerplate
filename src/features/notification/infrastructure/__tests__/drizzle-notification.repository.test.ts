import { beforeEach, describe, expect, it } from "vitest";

import type { Database } from "@/lib/db";
import { notification, user } from "@/lib/schema";
import { createTestDatabase } from "@/test/utils/test-database";

import { DrizzleNotificationRepository } from "../repositories/drizzle-notification.repository";

const readAt = new Date("2026-03-01T00:00:00.000Z");

describe("DrizzleNotificationRepository", () => {
  let db: Database;
  let repository: DrizzleNotificationRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    await db.insert(user).values([
      { id: "user-1", name: "Ada", email: "ada@example.com" },
      { id: "user-2", name: "Bob", email: "bob@example.com" },
    ]);
    repository = new DrizzleNotificationRepository(db);
  });

  async function seed() {
    await db.insert(notification).values([
      {
        id: "n-1",
        userId: "user-1",
        type: "test",
        data: { a: 1 },
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: "n-2",
        userId: "user-1",
        type: "test",
        data: [],
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
      },
      {
        id: "n-3",
        userId: "user-1",
        type: "test",
        data: {},
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
      },
      {
        id: "n-4",
        userId: "user-2",
        type: "test",
        data: {},
        readAt: new Date("2026-01-05T00:00:00.000Z"),
        createdAt: new Date("2026-01-03T00:00:00.000Z"),
      },
    ]);
  }

  it("creates one notification per user and returns them", async () => {
    const created = await repository.createMany({
      userIds: ["user-1", "user-2"],
      type: "test",
      data: { name: "Ada" },
      link: "/settings",
    });

    expect(created).toHaveLength(2);
    expect(created[0]).toMatchObject({
      userId: "user-1",
      type: "test",
      data: { name: "Ada" },
      link: "/settings",
      readAt: null,
    });
    await expect(
      repository.createMany({
        userIds: [],
        type: "test",
        data: {},
        link: null,
      }),
    ).resolves.toEqual([]);
  });

  it("pages through notifications newest first with a cursor", async () => {
    await seed();

    const first = await repository.list({ userId: "user-1", limit: 2 });
    const second = await repository.list({
      userId: "user-1",
      limit: 2,
      cursor: first.nextCursor ?? undefined,
    });

    expect(first.items.map((item) => item.id)).toEqual(["n-3", "n-2"]);
    expect(first.items[1].data).toEqual({});
    expect(first.nextCursor).toBe("n-2");
    expect(second.items.map((item) => item.id)).toEqual(["n-1"]);
    expect(second.nextCursor).toBeNull();
    await expect(
      repository.list({ userId: "user-1", limit: 2, cursor: "missing" }),
    ).resolves.toEqual({ items: [], nextCursor: null });
  });

  it("counts and marks unread notifications", async () => {
    await seed();

    expect(await repository.countUnread("user-1")).toBe(3);
    expect(
      await repository.markRead("user-1", ["n-1", "n-4", "missing"], readAt),
    ).toEqual(["n-1"]);
    expect(await repository.markRead("user-1", ["n-1"], readAt)).toEqual([]);
    expect(await repository.markRead("user-1", [], readAt)).toEqual([]);
    expect(await repository.markAllRead("user-1", readAt)).toBe(2);
    expect(await repository.countUnread("user-1")).toBe(0);
  });

  it("deletes notifications read before a date", async () => {
    await seed();

    expect(
      await repository.deleteReadBefore(new Date("2026-02-01T00:00:00.000Z")),
    ).toBe(1);
    expect(await db.$count(notification)).toBe(3);
  });
});
