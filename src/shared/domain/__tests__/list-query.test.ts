import { describe, expect, it } from "vitest";

import {
  formatDateRange,
  formatListSort,
  isoDayToLocalDate,
  parseDateRange,
  parseListSort,
  toDateRangeBounds,
  toIsoDay,
  toPaginatedResult,
} from "../list-query";

const SORT_FIELDS = ["name", "createdAt"] as const;

describe("parseListSort", () => {
  it("parses an allowed field and direction", () => {
    expect(parseListSort("createdAt.desc", SORT_FIELDS)).toEqual({
      field: "createdAt",
      direction: "desc",
    });
  });

  it.each([
    undefined,
    "",
    "name",
    ".asc",
    "email.asc",
    "name.up",
    "name.asc.desc",
  ])("rejects %s", (value) => {
    expect(parseListSort(value, SORT_FIELDS)).toBeNull();
  });
});

describe("formatListSort", () => {
  it("joins the field and the direction", () => {
    expect(formatListSort({ field: "name", direction: "asc" })).toBe(
      "name.asc",
    );
  });
});

describe("parseDateRange", () => {
  it("parses closed and open ranges", () => {
    expect(parseDateRange("2026-01-01..2026-01-31")).toEqual({
      from: "2026-01-01",
      to: "2026-01-31",
    });
    expect(parseDateRange("2026-01-01..")).toEqual({
      from: "2026-01-01",
      to: undefined,
    });
    expect(parseDateRange("..2026-01-31")).toEqual({
      from: undefined,
      to: "2026-01-31",
    });
  });

  it.each([
    undefined,
    "",
    "..",
    "2026-01-01",
    "2026-01-01..2026-01-31..2026-02-01",
    "2026-02-30..",
    "..2026-13-01",
    "2026-1-1..",
    "2026-02-01..2026-01-01",
  ])("rejects %s", (value) => {
    expect(parseDateRange(value)).toBeNull();
  });
});

describe("formatDateRange", () => {
  it("formats closed and open ranges", () => {
    expect(formatDateRange({ from: "2026-01-01", to: "2026-01-31" })).toBe(
      "2026-01-01..2026-01-31",
    );
    expect(formatDateRange({ from: "2026-01-01" })).toBe("2026-01-01..");
    expect(formatDateRange({ to: "2026-01-31" })).toBe("..2026-01-31");
  });

  it("returns undefined for an empty range", () => {
    expect(formatDateRange({})).toBeUndefined();
  });
});

describe("toDateRangeBounds", () => {
  it("includes the whole last day", () => {
    expect(toDateRangeBounds({ from: "2026-01-01", to: "2026-01-31" })).toEqual(
      {
        gte: new Date("2026-01-01T00:00:00.000Z"),
        lt: new Date("2026-02-01T00:00:00.000Z"),
      },
    );
  });

  it("keeps open sides undefined", () => {
    expect(toDateRangeBounds({ from: "2026-12-31" })).toEqual({
      gte: new Date("2026-12-31T00:00:00.000Z"),
    });
    expect(toDateRangeBounds({ to: "2026-12-31" })).toEqual({
      lt: new Date("2027-01-01T00:00:00.000Z"),
    });
  });
});

describe("local days", () => {
  it("round trips a local calendar day", () => {
    const date = isoDayToLocalDate("2026-03-09");

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(9);
    expect(toIsoDay(date)).toBe("2026-03-09");
  });
});

describe("toPaginatedResult", () => {
  it("computes the page count", () => {
    expect(
      toPaginatedResult({ items: ["a"], total: 41, page: 2, pageSize: 20 }),
    ).toEqual({ items: ["a"], total: 41, page: 2, pageSize: 20, pageCount: 3 });
  });

  it("keeps at least one page", () => {
    expect(
      toPaginatedResult({ items: [], total: 0, page: 1, pageSize: 20 })
        .pageCount,
    ).toBe(1);
  });
});
