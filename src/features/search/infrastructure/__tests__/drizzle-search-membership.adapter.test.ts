import { beforeAll, describe, expect, it } from "vitest";

import type { Database } from "@/lib/db";
import { member, organization, user } from "@/lib/schema";
import { createTestDatabase } from "@/test/utils/test-database";

import { DrizzleSearchMembershipAdapter } from "../adapters/drizzle-search-membership.adapter";

describe("DrizzleSearchMembershipAdapter", () => {
  let adapter: DrizzleSearchMembershipAdapter;

  beforeAll(async () => {
    const db: Database = await createTestDatabase();
    await db.insert(organization).values([
      { id: "org-1", name: "Acme", slug: "acme" },
      { id: "org-2", name: "Other", slug: "other" },
    ]);
    await db.insert(user).values([
      { id: "user-1", name: "Alice", email: "alice@example.com" },
      { id: "user-2", name: "Bob", email: "bob@example.com" },
    ]);
    await db.insert(member).values([
      { organizationId: "org-1", userId: "user-1", role: "admin" },
      { organizationId: "org-2", userId: "user-2", role: "owner" },
    ]);
    adapter = new DrizzleSearchMembershipAdapter(db);
  });

  it("finds the membership of a user in an organization", async () => {
    const membership = await adapter.findMembership({
      userId: "user-1",
      organizationId: "org-1",
    });

    expect(membership).toEqual({ organizationId: "org-1", role: "admin" });
  });

  it("returns null when the user is not a member of the organization", async () => {
    const membership = await adapter.findMembership({
      userId: "user-1",
      organizationId: "org-2",
    });

    expect(membership).toBeNull();
  });
});
