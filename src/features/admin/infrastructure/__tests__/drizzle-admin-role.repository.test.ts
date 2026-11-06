import { beforeEach, describe, expect, it } from "vitest";

import { role, user } from "@/lib/schema";
import { createTestDatabase } from "@/test/utils/test-database";

import { DrizzleAdminRoleRepository } from "../repositories/drizzle-admin-role.repository";

describe("DrizzleAdminRoleRepository", () => {
  let repository: DrizzleAdminRoleRepository;
  let db: Awaited<ReturnType<typeof createTestDatabase>>;

  beforeEach(async () => {
    db = await createTestDatabase();
    repository = new DrizzleAdminRoleRepository(db);
  });

  it("creates, lists, finds, upserts and deletes roles", async () => {
    await repository.createRole({
      key: "support",
      name: "Support",
      description: null,
      access: {},
    });
    await db.insert(role).values({ key: "billing", name: "Billing" });

    await expect(repository.listRoles()).resolves.toMatchObject([
      { key: "billing", description: null, access: {} },
      { key: "support" },
    ]);
    await expect(repository.findRoleByKey("missing")).resolves.toBeNull();

    const updated = await repository.updateRole({
      key: "support",
      name: "Helpdesk",
      description: "Answers tickets",
      access: {},
    });
    const created = await repository.updateRole({
      key: "ops",
      name: "Ops",
      description: null,
      access: {},
    });

    expect(updated).toMatchObject({
      key: "support",
      name: "Helpdesk",
      description: "Answers tickets",
    });
    expect(created.key).toBe("ops");
    await expect(repository.findRoleByKey("support")).resolves.toEqual(updated);

    await repository.deleteRole("support");

    await expect(repository.findRoleByKey("support")).resolves.toBeNull();
    await expect(repository.deleteRole("support")).rejects.toThrow();
  });

  it("counts active users by normalized role", async () => {
    await db.insert(user).values(
      [
        ["a", null],
        ["b", ""],
        ["c", "user"],
        ["d", "admin"],
        ["e", "support"],
        ["f", "support"],
      ].map(([id, roleKey]) => ({
        id: id as string,
        name: id as string,
        email: `${id}@example.com`,
        role: roleKey,
      })),
    );
    await db.insert(user).values({
      id: "g",
      name: "g",
      email: "g@example.com",
      role: "admin",
      deletedAt: new Date(),
    });

    await expect(repository.countUsersByRole()).resolves.toEqual({
      user: 3,
      admin: 1,
      support: 2,
    });
  });
});
