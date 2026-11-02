import { describe, expect, it } from "vitest";

import type { SearchContext } from "../../domain/search.types";
import { MemberSearchProvider } from "../providers/member-search.provider";

import { createQueryRawPrisma, getQuery } from "./prisma-search-provider.mock";

const context: SearchContext = {
  userId: "user-1",
  locale: "en",
  access: {},
  membership: { organizationId: "org-1", role: "owner" },
};

describe("MemberSearchProvider", () => {
  it("requires an owner or admin membership", () => {
    const { prisma } = createQueryRawPrisma([]);

    expect(new MemberSearchProvider(prisma).requirement).toEqual({
      kind: "organization",
      roles: ["owner", "admin"],
    });
  });

  it("searches members of the active organization only", async () => {
    const { prisma, queryRaw } = createQueryRawPrisma([
      { id: "member-1", name: "Zoé", email: "zoe@example.com" },
    ]);

    const results = await new MemberSearchProvider(prisma).search(
      { term: "zo", limit: 5 },
      context,
    );

    const { sql, values } = getQuery(queryRaw);
    expect(sql).toContain('"member"."organization_id" = ?');
    expect(sql).toContain('"user"."deleted_at" IS NULL');
    expect(values).toEqual(["org-1", "%zo%", "%zo%", "zo%", "zo%", 5]);
    expect(results).toEqual([
      {
        id: "member-1",
        type: "members",
        title: "Zoé",
        subtitle: "zoe@example.com",
        icon: "member",
        href: "/settings/organization",
      },
    ]);
  });

  it("returns nothing without a membership", async () => {
    const { prisma, queryRaw } = createQueryRawPrisma([]);

    const results = await new MemberSearchProvider(prisma).search(
      { term: "zo", limit: 5 },
      { ...context, membership: null },
    );

    expect(results).toEqual([]);
    expect(queryRaw).not.toHaveBeenCalled();
  });
});
