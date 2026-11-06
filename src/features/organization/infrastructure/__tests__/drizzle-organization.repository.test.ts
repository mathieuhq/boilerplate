import { beforeAll, describe, expect, it } from "vitest";

import type { Database } from "@/lib/db";
import { member, organization, user } from "@/lib/schema";
import { createTestDatabase } from "@/test/utils/test-database";

import { Organization } from "../../domain/entities/organization.entity";
import { DrizzleOrganizationRepository } from "../repositories/drizzle-organization.repository";

describe("DrizzleOrganizationRepository", () => {
  let repository: DrizzleOrganizationRepository;

  beforeAll(async () => {
    const db: Database = await createTestDatabase();

    await db.insert(user).values([
      { id: "user-1", name: "Ada", email: "ada@example.com" },
      { id: "user-2", name: "Bob", email: "bob@example.com" },
    ]);
    await db.insert(organization).values([
      {
        id: "org-first",
        name: "First Organization",
        slug: "first",
        logo: "https://example.com/logo.png",
      },
      { id: "org-second", name: "Second Organization", slug: "second" },
      { id: "org-member", name: "Member Organization", slug: "member" },
    ]);
    await db.insert(member).values([
      {
        id: "member-b",
        organizationId: "org-second",
        userId: "user-1",
        role: "owner",
        createdAt: new Date("2024-01-02"),
      },
      {
        id: "member-a",
        organizationId: "org-first",
        userId: "user-1",
        role: "admin",
        createdAt: new Date("2024-01-02"),
      },
      {
        id: "member-c",
        organizationId: "org-member",
        userId: "user-1",
        role: "member",
        createdAt: new Date("2024-01-01"),
      },
      {
        id: "member-d",
        organizationId: "org-member",
        userId: "user-2",
        role: "member",
        createdAt: new Date("2024-01-01"),
      },
    ]);

    repository = new DrizzleOrganizationRepository(db);
  });

  describe("findManageableByUser", () => {
    it("returns the oldest organization the user owns or administers", async () => {
      const result = await repository.findManageableByUser("user-1");

      expect(result).toBeInstanceOf(Organization);
      expect(result?.id).toBe("org-first");
      expect(result?.name).toBe("First Organization");
      expect(result?.slug).toBe("first");
      expect(result?.logo).toBe("https://example.com/logo.png");
    });

    it("uses the active organization when provided", async () => {
      const result = await repository.findManageableByUser(
        "user-1",
        "org-second",
      );

      expect(result?.id).toBe("org-second");
      expect(result?.logo).toBeUndefined();
    });

    it("returns null when the user is not an owner or admin of the active organization", async () => {
      await expect(
        repository.findManageableByUser("user-1", "org-member"),
      ).resolves.toBeNull();
    });

    it("returns null when the user does not have an owner or admin role", async () => {
      await expect(
        repository.findManageableByUser("user-2"),
      ).resolves.toBeNull();
    });
  });
});
