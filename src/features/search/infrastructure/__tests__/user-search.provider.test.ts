import { describe, expect, it } from "vitest";

import { UserSearchProvider } from "../providers/user-search.provider";

import { createQueryRawPrisma, getQuery } from "./prisma-search-provider.mock";

describe("UserSearchProvider", () => {
  it("requires read access to users", () => {
    const { prisma } = createQueryRawPrisma([]);

    expect(new UserSearchProvider(prisma).requirement).toEqual({
      kind: "access",
      feature: "users",
      level: "read",
    });
  });

  it("searches active users by normalized name and email", async () => {
    const { prisma, queryRaw } = createQueryRawPrisma([
      { id: "user-1", name: "Élodie Martin", email: "elodie+test@example.com" },
    ]);

    const results = await new UserSearchProvider(prisma).search({
      term: "elo_",
      limit: 5,
    });

    const { sql, values } = getQuery(queryRaw);
    expect(sql).toContain('"deleted_at" IS NULL');
    expect(sql).toContain('public.search_normalize("email")');
    expect(values).toEqual(["%elo\\_%", "%elo\\_%", "elo\\_%", "elo\\_%", 5]);
    expect(results).toEqual([
      {
        id: "user-1",
        type: "users",
        title: "Élodie Martin",
        subtitle: "elodie+test@example.com",
        icon: "user",
        href: "/admin/users?search=elodie%2Btest%40example.com",
      },
    ]);
  });
});
