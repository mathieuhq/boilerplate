import { beforeAll, describe, expect, it } from "vitest";

import type { Database } from "@/lib/db";
import { member, organization, role, user } from "@/lib/schema";
import { createTestDatabase } from "@/test/utils/test-database";

import { DrizzleNotificationRecipientsAdapter } from "../adapters/drizzle-notification-recipients.adapter";

describe("DrizzleNotificationRecipientsAdapter", () => {
  let adapter: DrizzleNotificationRecipientsAdapter;
  let db: Database;

  beforeAll(async () => {
    db = await createTestDatabase();

    await db.insert(user).values([
      { id: "admin", name: "Admin", email: "admin@example.com", role: "admin" },
      { id: "plain", name: "Plain", email: "plain@example.com", role: null },
      { id: "user", name: "User", email: "user@example.com", role: "user" },
      {
        id: "support",
        name: "Support",
        email: "support@example.com",
        role: "support",
      },
      {
        id: "deleted",
        name: "Deleted",
        email: "deleted@example.com",
        role: "admin",
        deletedAt: new Date("2026-01-01"),
      },
    ]);
    await db.insert(role).values([
      { key: "support", name: "Support", permissions: ["users:read"] },
      { key: "empty", name: "Empty" },
    ]);
    await db
      .insert(organization)
      .values({ id: "org-1", name: "Acme", slug: "acme" });
    await db.insert(member).values([
      { organizationId: "org-1", userId: "admin", role: "owner" },
      { organizationId: "org-1", userId: "plain", role: "member, admin" },
      { organizationId: "org-1", userId: "user", role: "member" },
      { organizationId: "org-1", userId: "deleted", role: "owner" },
    ]);

    adapter = new DrizzleNotificationRecipientsAdapter(db);
  });

  it("keeps only existing users that are not deleted", async () => {
    await expect(
      adapter.resolve({
        kind: "users",
        userIds: ["admin", "deleted", "missing"],
      }),
    ).resolves.toEqual(["admin"]);
    await expect(
      adapter.resolve({ kind: "users", userIds: [] }),
    ).resolves.toEqual([]);
  });

  it("resolves organization members, optionally filtered by role", async () => {
    const all = await adapter.resolve({
      kind: "organization",
      organizationId: "org-1",
    });
    const managers = await adapter.resolve({
      kind: "organization",
      organizationId: "org-1",
      roles: ["owner", "admin"],
    });

    expect(all.toSorted()).toEqual(["admin", "plain", "user"]);
    expect(managers.toSorted()).toEqual(["admin", "plain"]);
  });

  it("resolves users whose role grants the access", async () => {
    const readers = await adapter.resolve({
      kind: "access",
      feature: "users",
      level: "read",
    });
    const writers = await adapter.resolve({
      kind: "access",
      feature: "users",
      level: "write",
    });

    expect(readers.toSorted()).toEqual(["admin", "support"]);
    expect(writers).toEqual(["admin"]);
  });

  it("includes users without a role when the user role grants the access", async () => {
    await db.insert(role).values({
      key: "user",
      name: "User",
      permissions: ["overview:read"],
    });

    const result = await adapter.resolve({
      kind: "access",
      feature: "overview",
      level: "read",
    });

    expect(result.toSorted()).toEqual(["admin", "plain", "user"]);
  });
});
