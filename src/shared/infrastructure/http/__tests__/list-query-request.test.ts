import { defaultStringifySearch } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import {
  createListQuerySchema,
  listFilter,
} from "@/shared/interface/schemas/list-query.schema";

import { parseListQueryRequest } from "../list-query-request";

const schema = createListQuerySchema({
  sortFields: ["name"],
  filters: {
    role: listFilter.multiSelect(),
    banned: listFilter.boolean(),
  },
});

describe("parseListQueryRequest", () => {
  it("parses the search params written by the router", () => {
    const search = defaultStringifySearch({
      page: 2,
      sort: "name.asc",
      search: "123",
      role: ["admin", "user"],
      banned: true,
    });

    const query = parseListQueryRequest(
      new Request(
        `https://example.com/api/v1/private/admin/users/export${search}`,
      ),
      schema,
    );

    expect(query).toEqual({
      page: 2,
      pageSize: 20,
      sort: "name.asc",
      search: "123",
      role: ["admin", "user"],
      banned: true,
    });
  });

  it("falls back to the defaults without search params", () => {
    expect(
      parseListQueryRequest(new Request("https://example.com/export"), schema),
    ).toEqual({ page: 1, pageSize: 20 });
  });
});
