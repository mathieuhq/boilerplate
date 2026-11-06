import { beforeAll, describe, expect, it } from "vitest";

import type { Database } from "@/lib/db";
import { organization } from "@/lib/schema";
import { createTestDatabase } from "@/test/utils/test-database";

import { OrganizationSearchProvider } from "../providers/organization-search.provider";

describe("OrganizationSearchProvider", () => {
  let provider: OrganizationSearchProvider;

  beforeAll(async () => {
    const db: Database = await createTestDatabase();
    await db.insert(organization).values([
      { id: "org 1", name: "Acmé", slug: "acme" },
      { id: "org-2", name: "Beta", slug: "beta-acme" },
      { id: "org-3", name: "Zeta Acme Labs", slug: "zeta" },
      { id: "org-4", name: "100% Growth", slug: "growth" },
      { id: "org-5", name: "1000 Growth", slug: "thousand" },
      { id: "org-6", name: "Zulu", slug: "acme-zulu" },
    ]);
    provider = new OrganizationSearchProvider(db);
  });

  it("requires read access to organizations", () => {
    expect(provider.requirement).toEqual({
      kind: "access",
      feature: "organizations",
      level: "read",
    });
  });

  it("matches names regardless of case and accents", async () => {
    const results = await provider.search({ term: "ACMÉ LABS", limit: 5 });

    expect(results).toEqual([
      {
        id: "org-3",
        type: "organizations",
        title: "Zeta Acme Labs",
        subtitle: "zeta",
        icon: "organization",
        href: "/admin/organizations?search=zeta",
      },
    ]);
  });

  it("ranks prefix matches first, then sorts by name", async () => {
    const results = await provider.search({ term: "acme", limit: 5 });

    expect(results.map((result) => result.id)).toEqual([
      "org 1",
      "org-6",
      "org-2",
      "org-3",
    ]);
  });

  it("matches slugs and encodes them in the link", async () => {
    const results = await provider.search({ term: "beta-", limit: 5 });

    expect(results).toEqual([
      {
        id: "org-2",
        type: "organizations",
        title: "Beta",
        subtitle: "beta-acme",
        icon: "organization",
        href: "/admin/organizations?search=beta-acme",
      },
    ]);
  });

  it("applies the limit", async () => {
    const results = await provider.search({ term: "acme", limit: 1 });

    expect(results.map((result) => result.id)).toEqual(["org 1"]);
  });

  it("treats wildcards in the term literally", async () => {
    const results = await provider.search({ term: "100%", limit: 5 });

    expect(results.map((result) => result.id)).toEqual(["org-4"]);
  });
});
