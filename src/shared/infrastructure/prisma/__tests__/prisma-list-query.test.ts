import { describe, expect, it, vi } from "vitest";

import type { ListQuery } from "@/shared/domain/list-query";

import {
  containsInsensitive,
  type PrismaListConfig,
  toPrismaDateRange,
  toPrismaListArgs,
} from "../prisma-list-query";

type TestQuery = ListQuery<"name" | "createdAt" | "members"> & {
  role?: string[];
  banned?: boolean;
  createdAt?: string;
  internal?: string;
};

type TestWhere = Record<string, unknown> & { AND?: TestWhere[] };

type TestOrderBy = Record<string, unknown>;

const config: PrismaListConfig<TestQuery, TestWhere, TestOrderBy> = {
  where: { deletedAt: null },
  tieBreaker: { id: "desc" },
  defaultSort: { field: "createdAt", direction: "desc" },
  sortable: {
    name: "name",
    createdAt: "createdAt",
    members: (direction) => ({ members: { _count: direction } }),
  },
  search: (term) => ({ name: containsInsensitive(term) }),
  filters: {
    role: (roles) => ({ role: { in: roles } }),
    banned: (banned) => ({ banned }),
    createdAt: (value) => {
      const createdAt = toPrismaDateRange(value);

      return createdAt ? { createdAt } : undefined;
    },
  },
};

describe("toPrismaListArgs", () => {
  it("translates pagination, sort, search and filters", () => {
    const args = toPrismaListArgs<TestQuery, TestWhere, TestOrderBy>(
      {
        page: 3,
        pageSize: 25,
        sort: "name.asc",
        search: " acme ",
        role: ["admin", "user"],
        banned: false,
        createdAt: "2026-01-01..2026-01-31",
      },
      config,
    );

    expect(args).toEqual({
      page: 3,
      pageSize: 25,
      skip: 50,
      take: 25,
      orderBy: [{ name: "asc" }, { id: "desc" }],
      where: {
        AND: [
          { deletedAt: null },
          { name: { contains: "acme", mode: "insensitive" } },
          { role: { in: ["admin", "user"] } },
          { banned: false },
          {
            createdAt: {
              gte: new Date("2026-01-01T00:00:00.000Z"),
              lt: new Date("2026-02-01T00:00:00.000Z"),
            },
          },
        ],
      },
    });
  });

  it("restricts the rows to the selected ids", () => {
    const args = toPrismaListArgs<TestQuery, TestWhere, TestOrderBy>(
      { page: 1, pageSize: 20, ids: ["a", "b"] },
      config,
    );

    expect(args.where).toEqual({
      AND: [{ deletedAt: null }, { id: { in: ["a", "b"] } }],
    });
  });

  it("ignores an empty id selection", () => {
    const args = toPrismaListArgs<TestQuery, TestWhere, TestOrderBy>(
      { page: 1, pageSize: 20, ids: [] },
      config,
    );

    expect(args.where).toEqual({ deletedAt: null });
  });

  it("uses the default sort when the sort is missing or not whitelisted", () => {
    expect(
      toPrismaListArgs<TestQuery, TestWhere, TestOrderBy>(
        { page: 1, pageSize: 20 },
        config,
      ).orderBy,
    ).toEqual([{ createdAt: "desc" }, { id: "desc" }]);
    expect(
      toPrismaListArgs<TestQuery, TestWhere, TestOrderBy>(
        {
          page: 1,
          pageSize: 20,
          sort: "password.asc" as TestQuery["sort"],
        },
        config,
      ).orderBy,
    ).toEqual([{ createdAt: "desc" }, { id: "desc" }]);
  });

  it("supports relation sorts without a tie breaker", () => {
    const { tieBreaker: _tieBreaker, ...withoutTieBreaker } = config;

    expect(
      toPrismaListArgs<TestQuery, TestWhere, TestOrderBy>(
        { page: 1, pageSize: 20, sort: "members.desc" },
        withoutTieBreaker,
      ).orderBy,
    ).toEqual([{ members: { _count: "desc" } }]);
  });

  it("ignores filters that are empty or not whitelisted", () => {
    const build = vi.fn();
    const args = toPrismaListArgs<TestQuery, TestWhere, TestOrderBy>(
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

    expect(args.where).toEqual({ deletedAt: null });
    expect(build).not.toHaveBeenCalled();
  });

  it("returns an empty where without base, search or filters", () => {
    const args = toPrismaListArgs<TestQuery, TestWhere, TestOrderBy>(
      { page: 1, pageSize: 20, search: "acme", role: ["admin"] },
      {
        sortable: config.sortable,
        defaultSort: config.defaultSort,
        filters: { role: () => undefined },
        search: () => undefined,
      },
    );

    expect(args.where).toEqual({});
  });

  it("ignores search and filters when the config has none", () => {
    const args = toPrismaListArgs<TestQuery, TestWhere, TestOrderBy>(
      { page: 1, pageSize: 20, search: "acme", banned: true },
      { sortable: config.sortable, defaultSort: config.defaultSort },
    );

    expect(args.where).toEqual({});
  });

  it("clamps the page and the page size", () => {
    expect(
      toPrismaListArgs<TestQuery, TestWhere, TestOrderBy>(
        { page: 0, pageSize: 5000 },
        config,
      ),
    ).toMatchObject({ page: 1, pageSize: 100, skip: 0, take: 100 });
    expect(
      toPrismaListArgs<TestQuery, TestWhere, TestOrderBy>(
        { page: Number.NaN, pageSize: 0 },
        { ...config, maxPageSize: 500 },
      ),
    ).toMatchObject({ page: 1, pageSize: 1, skip: 0, take: 1 });
    expect(
      toPrismaListArgs<TestQuery, TestWhere, TestOrderBy>(
        { page: 2, pageSize: 400 },
        { ...config, maxPageSize: 500 },
      ),
    ).toMatchObject({ page: 2, pageSize: 400, skip: 400, take: 400 });
  });
});

describe("toPrismaDateRange", () => {
  it("returns undefined for an invalid range", () => {
    expect(toPrismaDateRange("2026-01-31..2026-01-01")).toBeUndefined();
  });

  it("returns the open bound only", () => {
    expect(toPrismaDateRange("2026-01-01..")).toEqual({
      gte: new Date("2026-01-01T00:00:00.000Z"),
    });
  });
});
