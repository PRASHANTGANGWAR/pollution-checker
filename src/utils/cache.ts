import logger from "../utils/logger";

class Cache<T = any> {
  private cache: Map<string, T>;
  private timers: Map<string, NodeJS.Timeout>;

  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * Set a value in the cache with optional TTL
   */
  set(key: string, value: T, ttl?: number): void {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
    }

    this.cache.set(key, value);

    if (ttl && ttl > 0) {
      const timer = setTimeout(() => {
        this.delete(key);
      }, ttl * 1000);
      this.timers.set(key, timer);
    }

    logger.debug("Cache set", { key, ttl, cacheSize: this.cache.size });
  }

  /**
   * Get a value from the cache
   */
  get(key: string): T | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      logger.debug("Cache hit", { key, cacheSize: this.cache.size });
    } else {
      logger.debug("Cache miss", { key, cacheSize: this.cache.size });
    }
    return value;
  }

  /**
   * Check if a key exists in the cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete a key from the cache
   */
  delete(key: string): boolean {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
      this.timers.delete(key);
    }

    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug("Cache delete", { key, cacheSize: this.cache.size });
    }
    return deleted;
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();

    const size = this.cache.size;
    this.cache.clear();
    logger.info("Cache cleared", { previousSize: size });
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; timerCount: number } {
    const stats = {
      size: this.cache.size,
      timerCount: this.timers.size,
    };
    logger.debug("Cache stats", stats);
    return stats;
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

export default new Cache();
