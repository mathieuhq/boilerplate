import { beforeAll, describe, expect, it } from "vitest";

import type { Database } from "@/lib/db";
import { member, organization, user } from "@/lib/schema";
import { createTestDatabase } from "@/test/utils/test-database";

import type { SearchContext } from "../../domain/search.types";
import { MemberSearchProvider } from "../providers/member-search.provider";

const context: SearchContext = {
  userId: "user-1",
  locale: "en",
  access: {},
  membership: { organizationId: "org-1", role: "owner" },
};

describe("MemberSearchProvider", () => {
  let provider: MemberSearchProvider;

  beforeAll(async () => {
    const db: Database = await createTestDatabase();
    await db.insert(organization).values([
      { id: "org-1", name: "Acme", slug: "acme" },
      { id: "org-2", name: "Other", slug: "other" },
    ]);
    await db.insert(user).values([
      { id: "user-1", name: "Zoé", email: "zoe@example.com" },
      { id: "user-2", name: "Alice", email: "alice.zoey@example.com" },
      { id: "user-3", name: "Zoltan", email: "zoltan@example.com" },
      {
        id: "user-4",
        name: "Zora",
        email: "zora@example.com",
        deletedAt: new Date(),
      },
    ]);
    await db.insert(member).values([
      {
        id: "member-1",
        organizationId: "org-1",
        userId: "user-1",
        role: "owner",
      },
      {
        id: "member-2",
        organizationId: "org-1",
        userId: "user-2",
        role: "member",
      },
      {
        id: "member-3",
        organizationId: "org-2",
        userId: "user-3",
        role: "member",
      },
      {
        id: "member-4",
        organizationId: "org-1",
        userId: "user-4",
        role: "member",
      },
    ]);
    provider = new MemberSearchProvider(db);
  });

  it("requires an owner or admin membership", () => {
    expect(provider.requirement).toEqual({
      kind: "organization",
      roles: ["owner", "admin"],
    });
  });

  it("searches active members of the active organization only", async () => {
    const results = await provider.search({ term: "ZO", limit: 5 }, context);

    expect(results).toEqual([
      {
        id: "member-1",
        type: "members",
        title: "Zoé",
        subtitle: "zoe@example.com",
        icon: "member",
        href: "/settings/organization",
      },
      {
        id: "member-2",
        type: "members",
        title: "Alice",
        subtitle: "alice.zoey@example.com",
        icon: "member",
        href: "/settings/organization",
      },
    ]);
  });

  it("matches names regardless of accents and applies the limit", async () => {
    const results = await provider.search({ term: "zoe", limit: 1 }, context);

    expect(results.map((result) => result.id)).toEqual(["member-1"]);
  });

  it("treats wildcards in the term literally", async () => {
    const results = await provider.search({ term: "_o", limit: 5 }, context);

    expect(results).toEqual([]);
  });

  it("returns nothing without a membership", async () => {
    const results = await provider.search(
      { term: "zo", limit: 5 },
      { ...context, membership: null },
    );

    expect(results).toEqual([]);
  });
});
