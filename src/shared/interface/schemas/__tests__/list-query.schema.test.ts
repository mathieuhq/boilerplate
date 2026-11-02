import { describe, expect, it } from "vitest";

import { createListQuerySchema, listFilter } from "../list-query.schema";

const schema = createListQuerySchema({
  sortFields: ["name", "createdAt"],
  filters: {
    status: listFilter.select(["active", "archived"]),
    tags: listFilter.multiSelect(),
    kinds: listFilter.multiSelect(["a", "b"]),
    verified: listFilter.boolean(),
    owner: listFilter.text(),
    createdAt: listFilter.dateRange(),
  },
});

describe("createListQuerySchema", () => {
  it("applies the defaults", () => {
    expect(schema.parse({})).toEqual({ page: 1, pageSize: 20 });
  });

  it("parses a complete query", () => {
    expect(
      schema.parse({
        page: 3,
        pageSize: 50,
        sort: "name.desc",
        search: "  acme ",
        status: "archived",
        tags: ["x", "y", "x"],
        kinds: "a",
        verified: "true",
        owner: 42,
        createdAt: "2026-01-01..2026-01-31",
      }),
    ).toEqual({
      page: 3,
      pageSize: 50,
      sort: "name.desc",
      search: "acme",
      status: "archived",
      tags: ["x", "y"],
      kinds: ["a"],
      verified: true,
      owner: "42",
      createdAt: "2026-01-01..2026-01-31",
    });
  });

  it("falls back instead of failing on invalid values", () => {
    expect(
      schema.parse({
        page: 0,
        pageSize: 1000,
        sort: "password.asc",
        search: "   ",
        status: "deleted",
        tags: [],
        kinds: ["c", "b"],
        verified: "yes",
        owner: { value: 1 },
        createdAt: "2026-02-01..2026-01-01",
      }),
    ).toEqual({ page: 1, pageSize: 20, kinds: ["b"] });
  });

  it("drops keys that are not whitelisted", () => {
    expect(schema.parse({ role: "admin", page: 2 })).toEqual({
      page: 2,
      pageSize: 20,
    });
  });

  it("parses false booleans and limits the text length", () => {
    const result = schema.parse({ verified: "false", search: "a".repeat(300) });

    expect(result.verified).toBe(false);
    expect(result.search).toHaveLength(200);
  });

  it("accepts a custom default page size", () => {
    const customSchema = createListQuerySchema({
      sortFields: ["name"],
      defaultPageSize: 50,
    });

    expect(customSchema.parse({ pageSize: "big" })).toEqual({
      page: 1,
      pageSize: 50,
    });
  });
});
