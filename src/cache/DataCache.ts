import { LRUCache } from "lru-cache";
import type { CacheEntryStats, CacheStats } from "../types";

interface DataCacheOptions<T> {
  ttl: number;
  name?: string;
  labelFn?: (data: T) => string | null;
  maxSize?: number;
}

type Entry<T> = { data: T; cachedAt: string };

export class DataCache<T> {
  private readonly store: LRUCache<string, Entry<T>>;
  private readonly name: string;
  private readonly labelFn: (data: T) => string | null;
  private readonly maxSize: number;
  private readonly ttlMs: number;
  private hits = 0;
  private misses = 0;

  constructor({ ttl, name = "DataCache", labelFn, maxSize = 10_000 }: DataCacheOptions<T>) {
    this.ttlMs = ttl * 1000;
    this.name = name;
    this.labelFn = labelFn ?? (() => null);
    this.maxSize = maxSize;
    this.store = new LRUCache<string, Entry<T>>({
      max: maxSize,
      ttl: this.ttlMs,
      allowStale: false,
    });
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    this.hits++;
    return entry.data;
  }

  set(key: string, data: T): void {
    this.store.set(key, { data, cachedAt: new Date().toISOString() });
  }

  invalidate(key: string): boolean {
    return this.store.delete(key);
  }

  flush(): number {
    const size = this.store.size;
    this.store.clear();
    return size;
  }

  getStats(): CacheStats {
    const entries: CacheEntryStats[] = [];
    for (const [key, entry] of this.store.entries()) {
      entries.push({
        key,
        cachedAt: entry.cachedAt,
        expiresInSeconds: Math.max(0, Math.round(this.store.getRemainingTTL(key) / 1000)),
        label: this.labelFn(entry.data),
      });
    }
    const total = this.hits + this.misses;
    return {
      name: this.name,
      totalEntries: this.store.size,
      maxSize: this.maxSize,
      ttlSeconds: this.ttlMs / 1000,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? Math.round((this.hits / total) * 100) : null,
      entries,
    };
  }
}
