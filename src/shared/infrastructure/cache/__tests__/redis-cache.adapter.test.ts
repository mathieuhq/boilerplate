import { describe, expect, it, vi } from "vitest";

import { createMemoryCacheStore } from "@/test/utils/mock-factories";

import { NoopCacheAdapter } from "../noop-cache.adapter";
import { RedisCacheAdapter } from "../redis-cache.adapter";

const createStore = (entries: Record<string, string> = {}) => {
  const store = createMemoryCacheStore();

  Object.entries(entries).forEach(([key, value]) => store.data.set(key, value));

  return { store, data: store.data };
};

describe("RedisCacheAdapter", () => {
  it("loads and stores the value with a TTL on a miss", async () => {
    const { store } = createStore();
    const cache = new RedisCacheAdapter(store, "app/cache");
    const load = vi.fn().mockResolvedValue({ count: 3 });

    await expect(cache.getOrSet("metrics", 60, load)).resolves.toEqual({
      count: 3,
    });
    expect(load).toHaveBeenCalledOnce();
    expect(store.set).toHaveBeenCalledWith(
      "app/cache:metrics",
      JSON.stringify({ count: 3 }),
      "EX",
      60,
    );
  });

  it("returns the cached value without loading on a hit", async () => {
    const { store } = createStore({
      "app/cache:user:1": JSON.stringify({
        id: "1",
        createdAt: { $date: "2026-01-01T00:00:00.000Z" },
      }),
    });
    const cache = new RedisCacheAdapter(store, "app/cache");
    const load = vi.fn();

    await expect(cache.getOrSet("user:1", 60, load)).resolves.toEqual({
      id: "1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    expect(load).not.toHaveBeenCalled();
  });

  it("does not store null values", async () => {
    const { store } = createStore();
    const cache = new RedisCacheAdapter(store, "app/cache");

    await expect(
      cache.getOrSet("user:missing", 60, async () => null),
    ).resolves.toBeNull();
    expect(store.set).not.toHaveBeenCalled();
  });

  it("falls back to the loader when the store fails", async () => {
    const { store } = createStore();
    store.get.mockRejectedValue(new Error("down"));
    store.set.mockRejectedValue(new Error("down"));
    const onError = vi.fn();
    const cache = new RedisCacheAdapter(store, "app/cache", onError);

    await expect(cache.getOrSet("metrics", 60, async () => 7)).resolves.toBe(7);
    expect(onError).toHaveBeenCalledWith("Cache read failed", {
      error: expect.any(Error),
      key: "app/cache:metrics",
    });
    expect(onError).toHaveBeenCalledWith("Cache write failed", {
      error: expect.any(Error),
      key: "app/cache:metrics",
    });
  });

  it("reloads when the cached payload is corrupt", async () => {
    const { store } = createStore({ "app/cache:metrics": "{" });
    const cache = new RedisCacheAdapter(store, "app/cache");

    await expect(cache.getOrSet("metrics", 60, async () => 1)).resolves.toBe(1);
  });

  it("deletes prefixed keys", async () => {
    const { store, data } = createStore({
      "app/cache:a": "1",
      "app/cache:b": "2",
    });
    const cache = new RedisCacheAdapter(store, "app/cache");

    await cache.delete("a", "b");

    expect(store.del).toHaveBeenCalledWith("app/cache:a", "app/cache:b");
    expect(data.size).toBe(0);
  });

  it("skips the store when there is nothing to delete", async () => {
    const { store } = createStore();
    const cache = new RedisCacheAdapter(store, "app/cache");

    await cache.delete();

    expect(store.del).not.toHaveBeenCalled();
  });

  it("reports delete failures without throwing", async () => {
    const { store } = createStore();
    store.del.mockRejectedValue(new Error("down"));
    const onError = vi.fn();
    const cache = new RedisCacheAdapter(store, "app/cache", onError);

    await expect(cache.delete("a")).resolves.toBeUndefined();
    expect(onError).toHaveBeenCalledWith("Cache delete failed", {
      error: expect.any(Error),
      keys: ["a"],
    });
  });
});

describe("NoopCacheAdapter", () => {
  it("always calls the loader", async () => {
    const cache = new NoopCacheAdapter();
    const load = vi.fn().mockResolvedValue("value");

    await expect(cache.getOrSet("key", 60, load)).resolves.toBe("value");
    await expect(cache.getOrSet("key", 60, load)).resolves.toBe("value");
    await expect(cache.delete("key")).resolves.toBeUndefined();
    expect(load).toHaveBeenCalledTimes(2);
  });
});
