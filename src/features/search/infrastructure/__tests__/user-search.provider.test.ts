import { beforeAll, describe, expect, it } from "vitest";

import type { Database } from "@/lib/db";
import { user } from "@/lib/schema";
import { createTestDatabase } from "@/test/utils/test-database";

import { UserSearchProvider } from "../providers/user-search.provider";

describe("UserSearchProvider", () => {
  let provider: UserSearchProvider;

  beforeAll(async () => {
    const db: Database = await createTestDatabase();
    await db.insert(user).values([
      { id: "user-1", name: "Éloïse Martin", email: "eloise@example.com" },
      { id: "user-2", name: "Marc Eloi", email: "marc@example.com" },
      { id: "user-3", name: "Bob", email: "elo_dev+test@example.com" },
      { id: "user-4", name: "Carl", email: "eloxdev@example.com" },
      {
        id: "user-5",
        name: "Eloi Deleted",
        email: "deleted@example.com",
        deletedAt: new Date(),
      },
    ]);
    provider = new UserSearchProvider(db);
  });

  it("requires read access to users", () => {
    expect(provider.requirement).toEqual({
      kind: "access",
      feature: "users",
      level: "read",
    });
  });

  it("matches names regardless of case and accents", async () => {
    const results = await provider.search({ term: "ELOISE", limit: 5 });

    expect(results).toEqual([
      {
        id: "user-1",
        type: "users",
        title: "Éloïse Martin",
        subtitle: "eloise@example.com",
        icon: "user",
        href: "/admin/users?search=eloise%40example.com",
      },
    ]);
  });

  it("ranks prefix matches first, then sorts by name and skips deleted users", async () => {
    const results = await provider.search({ term: "elo", limit: 5 });

    expect(results.map((result) => result.id)).toEqual([
      "user-3",
      "user-4",
      "user-1",
      "user-2",
    ]);
  });

  it("applies the limit", async () => {
    const results = await provider.search({ term: "elo", limit: 2 });

    expect(results.map((result) => result.id)).toEqual(["user-3", "user-4"]);
  });

  it("treats wildcards in the term literally", async () => {
    const results = await provider.search({ term: "elo_", limit: 5 });

    expect(results).toEqual([
      {
        id: "user-3",
        type: "users",
        title: "Bob",
        subtitle: "elo_dev+test@example.com",
        icon: "user",
        href: "/admin/users?search=elo_dev%2Btest%40example.com",
      },
    ]);
  });
});
