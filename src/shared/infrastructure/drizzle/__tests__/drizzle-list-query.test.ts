import { desc, eq, inArray, isNull, type SQL } from "drizzle-orm";
import {
  boolean,
  PgDialect,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

import type { ListQuery } from "@/shared/domain/list-query";

import {
  containsInsensitive,
  type DrizzleListConfig,
  sortNullsLast,
  toDateRangeWhere,
  toDrizzleListArgs,
} from "../drizzle-list-query";

const people = pgTable("people", {
  id: text("id").primaryKey(),
  name: text("name"),
  role: text("role"),
  banned: boolean("banned"),
  createdAt: timestamp("created_at"),
  deletedAt: timestamp("deleted_at"),
  lastSeenAt: timestamp("last_seen_at"),
});

type TestQuery = ListQuery<"name" | "createdAt" | "lastSeenAt"> & {
  role?: string[];
  banned?: boolean;
  createdAt?: string;
  internal?: string;
};

const dialect = new PgDialect();

function render(value: SQL | undefined) {
  if (!value) return undefined;

  const { sql, params } = dialect.sqlToQuery(value);

  return { sql, params };
}

function renderAll(values: SQL[]) {
  return values.map((value) => dialect.sqlToQuery(value).sql);
}

const config: DrizzleListConfig<TestQuery> = {
  id: people.id,
  where: isNull(people.deletedAt),
  tieBreaker: desc(people.id),
  defaultSort: { field: "createdAt", direction: "desc" },
  sortable: {
    name: people.name,
    createdAt: people.createdAt,
    lastSeenAt: sortNullsLast(people.lastSeenAt),
  },
  search: (term) => containsInsensitive(people.name, term),
  filters: {
    role: (roles) => inArray(people.role, roles),
    banned: (banned) => eq(people.banned, banned),
    createdAt: (value) => toDateRangeWhere(people.createdAt, value),
  },
};

describe("toDrizzleListArgs", () => {
  it("translates pagination, sort, search and filters", () => {
    const args = toDrizzleListArgs<TestQuery>(
      {
        page: 3,
        pageSize: 25,
        sort: "name.asc",
        search: " ac%me ",
        role: ["admin", "user"],
        banned: false,
        createdAt: "2026-01-01..2026-01-31",
      },
      config,
    );

    expect(args).toMatchObject({
      page: 3,
      pageSize: 25,
      offset: 50,
      limit: 25,
    });
    expect(renderAll(args.orderBy)).toEqual([
      '"people"."name" asc',
      '"people"."id" desc',
    ]);
    expect(render(args.where)).toEqual({
      sql: '("people"."deleted_at" is null and "people"."name" ilike $1 and "people"."role" in ($2, $3) and "people"."banned" = $4 and ("people"."created_at" >= $5 and "people"."created_at" < $6))',
      params: [
        "%ac\\%me%",
        "admin",
        "user",
        false,
        "2026-01-01T00:00:00.000Z",
        "2026-02-01T00:00:00.000Z",
      ],
    });
  });

  it("restricts the rows to the selected ids", () => {
    const args = toDrizzleListArgs<TestQuery>(
      { page: 1, pageSize: 20, ids: ["a", "b"] },
      config,
    );

    expect(render(args.where)).toEqual({
      sql: '("people"."deleted_at" is null and "people"."id" in ($1, $2))',
      params: ["a", "b"],
    });
  });

  it("ignores an empty id selection", () => {
    const args = toDrizzleListArgs<TestQuery>(
      { page: 1, pageSize: 20, ids: [] },
      config,
    );

    expect(render(args.where)?.sql).toBe('"people"."deleted_at" is null');
  });

  it("uses the default sort when the sort is missing or not whitelisted", () => {
    const expected = ['"people"."created_at" desc', '"people"."id" desc'];

    expect(
      renderAll(
        toDrizzleListArgs<TestQuery>({ page: 1, pageSize: 20 }, config).orderBy,
      ),
    ).toEqual(expected);
    expect(
      renderAll(
        toDrizzleListArgs<TestQuery>(
          {
            page: 1,
            pageSize: 20,
            sort: "password.asc" as TestQuery["sort"],
          },
          config,
        ).orderBy,
      ),
    ).toEqual(expected);
  });

  it("supports custom sorts without a tie breaker", () => {
    const { tieBreaker: _tieBreaker, ...withoutTieBreaker } = config;

    expect(
      renderAll(
        toDrizzleListArgs<TestQuery>(
          { page: 1, pageSize: 20, sort: "lastSeenAt.asc" },
          withoutTieBreaker,
        ).orderBy,
      ),
    ).toEqual(['"people"."last_seen_at" asc nulls last']);
  });

  it("ignores filters that are empty or not whitelisted", () => {
    const build = vi.fn();
    const args = toDrizzleListArgs<TestQuery>(
      {
        page: 1,
        pageSize: 20,
        search: "   ",
        role: [],
        createdAt: "not-a-range",
        internal: "secret",
      },
      {
        ...config,
        filters: { ...config.filters, banned: build },
      },
    );

    expect(render(args.where)?.sql).toBe('"people"."deleted_at" is null');
    expect(build).not.toHaveBeenCalled();
  });

  it("returns no where without base, search or filters", () => {
    const args = toDrizzleListArgs<TestQuery>(
      { page: 1, pageSize: 20, search: "acme", role: ["admin"] },
      {
        id: people.id,
        sortable: config.sortable,
        defaultSort: config.defaultSort,
        filters: { role: () => undefined },
        search: () => undefined,
      },
    );

    expect(args.where).toBeUndefined();
  });

  it("ignores search and filters when the config has none", () => {
    const args = toDrizzleListArgs<TestQuery>(
      { page: 1, pageSize: 20, search: "acme", banned: true },
      {
        id: people.id,
        sortable: config.sortable,
        defaultSort: config.defaultSort,
      },
    );

    expect(args.where).toBeUndefined();
  });

  it("clamps the page and the page size", () => {
    expect(
      toDrizzleListArgs<TestQuery>({ page: 0, pageSize: 5000 }, config),
    ).toMatchObject({ page: 1, pageSize: 100, offset: 0, limit: 100 });
    expect(
      toDrizzleListArgs<TestQuery>(
        { page: Number.NaN, pageSize: 0 },
        { ...config, maxPageSize: 500 },
      ),
    ).toMatchObject({ page: 1, pageSize: 1, offset: 0, limit: 1 });
    expect(
      toDrizzleListArgs<TestQuery>(
        { page: 2, pageSize: 400 },
        { ...config, maxPageSize: 500 },
      ),
    ).toMatchObject({ page: 2, pageSize: 400, offset: 400, limit: 400 });
  });
});

describe("toDateRangeWhere", () => {
  it("returns undefined for an invalid range", () => {
    expect(
      toDateRangeWhere(people.createdAt, "2026-01-31..2026-01-01"),
    ).toBeUndefined();
  });

  it("returns the open bound only", () => {
    expect(render(toDateRangeWhere(people.createdAt, "2026-01-01.."))).toEqual({
      sql: '"people"."created_at" >= $1',
      params: ["2026-01-01T00:00:00.000Z"],
    });
  });
});
