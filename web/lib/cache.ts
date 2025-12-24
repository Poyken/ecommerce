/**
 * Advanced Caching Utilities for Next.js 15+
 *
 * Sử dụng unstable_cache API để fine-grained control caching
 * Patterns:
 * - Stale-while-revalidate
 * - Cache warming
 * - Selective invalidation
 */

import { unstable_cache } from "next/cache";

/**
 * Cache wrapper with tags for selective invalidation
 */
export function createCachedFunction<
  T extends (...args: any[]) => Promise<any>
>(
  fn: T,
  {
    keyPrefix,
    tags = [],
    revalidate,
  }: {
    keyPrefix: string;
    tags?: string[];
    revalidate?: number | false;
  }
): T {
  return ((...args: Parameters<T>) => {
    const cacheKey = `${keyPrefix}-${JSON.stringify(args)}`;

    return unstable_cache(async () => fn(...args), [cacheKey], {
      tags: [...tags, cacheKey],
      revalidate,
    })();
  }) as T;
}

/**
 * Stale-While-Revalidate pattern
 * Returns cached data immediately, revalidates in background
 */
export function createSWRCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  {
    keyPrefix,
    staleTime = 60, // 1 minute stale
    revalidateTime = 300, // 5 minutes revalidate
  }: {
    keyPrefix: string;
    staleTime?: number;
    revalidateTime?: number;
  }
): T {
  return ((...args: Parameters<T>) => {
    const cacheKey = `swr-${keyPrefix}-${JSON.stringify(args)}`;

    return unstable_cache(
      async () => {
        try {
          return await fn(...args);
        } catch (error) {
          console.error(`SWR Cache error for ${cacheKey}:`, error);
          // Return stale data on error if available
          throw error;
        }
      },
      [cacheKey],
      {
        tags: [keyPrefix, cacheKey],
        revalidate: staleTime,
      }
    )();
  }) as T;
}

/**
 * Cache with automatic warming
 * Pre-populate cache for frequently accessed data
 */
export async function warmCache<T>(
  fn: () => Promise<T>,
  {
    key,
    tags = [],
    revalidate = 3600,
  }: {
    key: string;
    tags?: string[];
    revalidate?: number;
  }
): Promise<T> {
  const cachedFn = unstable_cache(fn, [key], {
    tags: [...tags, key],
    revalidate,
  });

  return cachedFn();
}

/**
 * Multi-level caching:
 * 1. Memory cache (fastest, per-request)
 * 2. Next.js cache (server-side, persistent)
 * 3. API call (slowest, when cache miss)
 */
const memoryCache = new Map<string, { data: any; expires: number }>();

export function createMultiLevelCache<
  T extends (...args: any[]) => Promise<any>
>(
  fn: T,
  {
    keyPrefix,
    memoryTTL = 10, // 10 seconds in memory
    cacheTTL = 60, // 60 seconds in Next.js cache
    tags = [],
  }: {
    keyPrefix: string;
    memoryTTL?: number;
    cacheTTL?: number;
    tags?: string[];
  }
): T {
  return (async (...args: Parameters<T>) => {
    const cacheKey = `${keyPrefix}-${JSON.stringify(args)}`;
    const now = Date.now();

    // Level 1: Memory cache
    const memCached = memoryCache.get(cacheKey);
    if (memCached && memCached.expires > now) {
      return memCached.data;
    }

    // Level 2: Next.js cache
    const cachedFn = unstable_cache(async () => fn(...args), [cacheKey], {
      tags: [...tags, cacheKey],
      revalidate: cacheTTL,
    });

    const result = await cachedFn();

    // Store in memory cache
    memoryCache.set(cacheKey, {
      data: result,
      expires: now + memoryTTL * 1000,
    });

    // Cleanup old memory cache entries
    if (memoryCache.size > 100) {
      const keysToDelete: string[] = [];
      memoryCache.forEach((value, key) => {
        if (value.expires < now) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach((key) => memoryCache.delete(key));
    }

    return result;
  }) as T;
}

/**
 * Deduplicate concurrent requests
 * Multiple simultaneous requests for same data = only 1 API call
 */
const pendingRequests = new Map<string, Promise<any>>();

export function createDedupedCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyPrefix: string
): T {
  return (async (...args: Parameters<T>) => {
    const cacheKey = `${keyPrefix}-${JSON.stringify(args)}`;

    // Return existing pending request if any
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }

    // Create new request
    const promise = fn(...args).finally(() => {
      pendingRequests.delete(cacheKey);
    });

    pendingRequests.set(cacheKey, promise);
    return promise;
  }) as T;
}

/**
 * Batch requests together
 * Combine multiple similar requests into one
 */
export function createBatchedCache<T>(
  fetcher: (ids: string[]) => Promise<T[]>,
  {
    maxBatchSize = 10,
    maxWaitMs = 50,
  }: {
    maxBatchSize?: number;
    maxWaitMs?: number;
  }
) {
  let batch: string[] = [];
  let resolvers: Array<(value: T | null) => void> = [];
  let timeoutId: NodeJS.Timeout | null = null;

  const executeBatch = async () => {
    if (batch.length === 0) return;

    const currentBatch = batch.splice(0);
    const currentResolvers = resolvers.splice(0);

    try {
      const results = await fetcher(currentBatch);
      const resultMap = new Map(results.map((item: any) => [item.id, item]));

      currentBatch.forEach((id, index) => {
        currentResolvers[index](resultMap.get(id) || null);
      });
    } catch (error) {
      currentResolvers.forEach((resolve) => resolve(null));
    }
  };

  return async (id: string): Promise<T | null> => {
    return new Promise((resolve) => {
      batch.push(id);
      resolvers.push(resolve);

      if (batch.length >= maxBatchSize) {
        if (timeoutId) clearTimeout(timeoutId);
        executeBatch();
      } else if (!timeoutId) {
        timeoutId = setTimeout(() => {
          timeoutId = null;
          executeBatch();
        }, maxWaitMs);
      }
    });
  };
}
