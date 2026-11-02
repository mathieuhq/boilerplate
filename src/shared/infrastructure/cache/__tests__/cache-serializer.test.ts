import { describe, expect, it } from "vitest";

import {
  deserializeCacheValue,
  serializeCacheValue,
} from "../cache-serializer";

describe("cache serializer", () => {
  it("restores nested dates", () => {
    const value = {
      createdAt: new Date("2026-01-02T03:04:05.000Z"),
      items: [{ at: new Date("2026-02-03T04:05:06.000Z"), label: "a" }],
      birthDate: null,
    };

    const restored = deserializeCacheValue<typeof value>(
      serializeCacheValue(value),
    );

    expect(restored).toEqual(value);
    expect(restored.createdAt).toBeInstanceOf(Date);
    expect(restored.items[0].at).toBeInstanceOf(Date);
  });

  it("keeps ISO strings as strings", () => {
    const value = { createdAt: "2026-01-02T03:04:05.000Z" };

    expect(deserializeCacheValue(serializeCacheValue(value))).toEqual(value);
  });

  it("keeps objects with extra keys next to the date tag", () => {
    const value = { $date: "2026-01-02T03:04:05.000Z", other: true };

    expect(deserializeCacheValue(serializeCacheValue(value))).toEqual(value);
  });
});
