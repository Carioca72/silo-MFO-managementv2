export class CacheManager<T> {
  private cache: Map<string, { data: T; expiresAt: number }>;
  private ttlSeconds: number;

  constructor(ttlSeconds: number) {
    this.cache = new Map();
    this.ttlSeconds = ttlSeconds;
  }

  set(key: string, data: T): void {
    const expiresAt = Date.now() + this.ttlSeconds * 1000;
    this.cache.set(key, { data, expiresAt });
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}
