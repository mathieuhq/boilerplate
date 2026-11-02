export type ICachePort = {
  getOrSet: <T>(
    key: string,
    ttlSeconds: number,
    load: () => Promise<T>,
  ) => Promise<T>;
  delete: (...keys: string[]) => Promise<void>;
};
