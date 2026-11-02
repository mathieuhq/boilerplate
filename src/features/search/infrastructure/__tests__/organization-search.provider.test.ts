import { describe, expect, it } from "vitest";

import { OrganizationSearchProvider } from "../providers/organization-search.provider";

import { createQueryRawPrisma, getQuery } from "./prisma-search-provider.mock";

describe("OrganizationSearchProvider", () => {
  it("requires read access to organizations", () => {
    const { prisma } = createQueryRawPrisma([]);

    expect(new OrganizationSearchProvider(prisma).requirement).toEqual({
      kind: "access",
      feature: "organizations",
      level: "read",
    });
  });

  it("searches organizations by normalized name and slug", async () => {
    const { prisma, queryRaw } = createQueryRawPrisma([
      { id: "org 1", name: "Acmé", slug: "acme" },
    ]);

    const results = await new OrganizationSearchProvider(prisma).search({
      term: "acme",
      limit: 3,
    });

    const { sql, values } = getQuery(queryRaw);
    expect(sql).toContain('FROM "organization"');
    expect(sql).toContain('public.search_normalize("slug")');
    expect(values).toEqual(["%acme%", "%acme%", "acme%", "acme%", 3]);
    expect(results).toEqual([
      {
        id: "org 1",
        type: "organizations",
        title: "Acmé",
        subtitle: "acme",
        icon: "organization",
        href: "/admin/organizations?search=acme",
      },
    ]);
  });
});
