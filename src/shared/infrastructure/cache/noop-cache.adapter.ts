import type { ICachePort } from "@/shared/application/ports/cache.port";

export class NoopCacheAdapter implements ICachePort {
  async getOrSet<T>(
    _key: string,
    _ttlSeconds: number,
    load: () => Promise<T>,
  ): Promise<T> {
    return load();
  }

  async delete(..._keys: string[]): Promise<void> {
    return undefined;
  }
}
