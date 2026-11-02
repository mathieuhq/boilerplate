import { describe, expect, it, vi } from "vitest";

import { toPaginatedResult } from "@/shared/domain/list-query";

import { describeListQuery, iterateListPages } from "../list-pages";

function createSource(total: number) {
  const rows = Array.from({ length: total }, (_, index) => index);

  return vi.fn(async (page: number, pageSize: number) =>
    toPaginatedResult({
      items: rows.slice((page - 1) * pageSize, page * pageSize),
      total,
      page,
      pageSize,
    }),
  );
}

async function collect<T>(batches: AsyncIterable<T[]>) {
  const collected: T[][] = [];

  for await (const batch of batches) collected.push(batch);

  return collected;
}

describe("iterateListPages", () => {
  it("yields every page until the last one", async () => {
    const fetchPage = createSource(5);

    const batches = await collect(
      iterateListPages(fetchPage, { pageSize: 2, maxRows: 100 }),
    );

    expect(batches).toEqual([[0, 1], [2, 3], [4]]);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });

  it("stops at the row limit", async () => {
    const fetchPage = createSource(10);

    const batches = await collect(
      iterateListPages(fetchPage, { pageSize: 4, maxRows: 6 }),
    );

    expect(batches).toEqual([
      [0, 1, 2, 3],
      [4, 5],
    ]);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("stops when a page is shorter than requested", async () => {
    const fetchPage = vi.fn(async (page: number) => ({
      items: [page],
      total: 10,
      page,
      pageSize: 5,
      pageCount: 2,
    }));

    const batches = await collect(
      iterateListPages(fetchPage, { pageSize: 5, maxRows: 100 }),
    );

    expect(batches).toEqual([[1]]);
  });

  it("yields nothing for an empty list", async () => {
    const fetchPage = createSource(0);

    const batches = await collect(iterateListPages(fetchPage, { maxRows: 10 }));

    expect(batches).toEqual([]);
    expect(fetchPage).toHaveBeenCalledWith(1, 100);
  });

  it("never queries when no row is allowed", async () => {
    const fetchPage = createSource(3);

    const batches = await collect(iterateListPages(fetchPage, { maxRows: 0 }));

    expect(batches).toEqual([]);
    expect(fetchPage).not.toHaveBeenCalled();
  });
});

describe("describeListQuery", () => {
  it("keeps the meaningful filters only", () => {
    expect(
      describeListQuery({
        page: 2,
        pageSize: 50,
        sort: "name.asc",
        search: "",
        role: ["admin"],
        tags: [],
        mixed: ["a", 1],
        banned: false,
        limit: 5,
        missing: undefined,
        nested: { value: 1 },
      }),
    ).toEqual({ sort: "name.asc", role: ["admin"], banned: false, limit: 5 });
  });
});
