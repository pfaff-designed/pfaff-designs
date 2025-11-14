/**
 * Caching layer for Knowledge Base data
 * Implements session-level and topic-level caching per architecture
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class KBCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.DEFAULT_TTL);

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
    });
  }

  /**
   * Clear cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache key for topic-level caching
   */
  getTopicKey(topic: string, type: "media" | "metadata" | "full"): string {
    return `kb:topic:${topic}:${type}`;
  }

  /**
   * Get cache key for session-level YAML caching
   */
  getYAMLKey(query: string, intent: string): string {
    // Create a stable key from query and intent
    const key = `${query}:${intent}`.toLowerCase().replace(/\s+/g, "-");
    return `kb:yaml:${key}`;
  }
}

// Singleton instance
export const kbCache = new KBCache();

