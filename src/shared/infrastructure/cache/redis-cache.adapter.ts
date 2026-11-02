import type { ICachePort } from "@/shared/application/ports/cache.port";

import { deserializeCacheValue, serializeCacheValue } from "./cache-serializer";

export type CacheStore = {
  get: (key: string) => Promise<string | null>;
  set: (
    key: string,
    value: string,
    mode: "EX",
    ttlSeconds: number,
  ) => Promise<unknown>;
  del: (...keys: string[]) => Promise<number>;
};

type CacheErrorHandler = (
  message: string,
  details: Record<string, unknown>,
) => void;

export class RedisCacheAdapter implements ICachePort {
  constructor(
    private readonly store: CacheStore,
    private readonly keyPrefix: string,
    private readonly onError?: CacheErrorHandler,
  ) {}

  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    load: () => Promise<T>,
  ): Promise<T> {
    const storeKey = this.toStoreKey(key);
    const cached = await this.read<T>(storeKey);

    if (cached !== undefined) return cached;

    const value = await load();

    if (value !== null && value !== undefined)
      await this.write(storeKey, value, ttlSeconds);

    return value;
  }

  async delete(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    try {
      await this.store.del(...keys.map((key) => this.toStoreKey(key)));
    } catch (error) {
      this.onError?.("Cache delete failed", { error, keys });
    }
  }

  private async read<T>(storeKey: string): Promise<T | undefined> {
    try {
      const payload = await this.store.get(storeKey);

      return payload === null ? undefined : deserializeCacheValue<T>(payload);
    } catch (error) {
      this.onError?.("Cache read failed", { error, key: storeKey });

      return undefined;
    }
  }

  private async write(storeKey: string, value: unknown, ttlSeconds: number) {
    try {
      await this.store.set(
        storeKey,
        serializeCacheValue(value),
        "EX",
        ttlSeconds,
      );
    } catch (error) {
      this.onError?.("Cache write failed", { error, key: storeKey });
    }
  }

  private toStoreKey(key: string) {
    return `${this.keyPrefix}:${key}`;
  }
}
