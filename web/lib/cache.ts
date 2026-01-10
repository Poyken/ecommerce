/**
 * =====================================================================
 * ADVANCED CACHING UTILITIES - Tối ưu hóa bộ nhớ đệm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. UNSTABLE_CACHE (Next.js 15+):
 * - Đây là API mạnh mẽ của Next.js để cache kết quả của các hàm bất đồng bộ (ví dụ: gọi database, gọi API).
 * - Khác với fetch cache, nó cho phép ta gắn "tags" để xóa cache một cách có chọn lọc (`revalidateTag`).
 *
 * 2. CÁC PATTERNS CACHE PHỔ BIẾN:
 * - SWR (Stale-While-Revalidate): Trả về dữ liệu cũ ngay lập tức và âm thầm cập nhật dữ liệu mới ở background.
 * - Multi-level: Kết hợp Memory cache (cực nhanh) và Next.js cache (bền vững).
 * - Deduplication: Nếu 10 nơi cùng gọi 1 API tại 1 thời điểm, chỉ có 1 request thực sự được gửi đi.
 *
 * 3. TẠI SAO PHẢI DÙNG?
 * - Giảm chi phí server (Database/API calls).
 * - Tăng tốc độ phản hồi (TTFB) cho người dùng cuối.
 * =====================================================================
 */

import { unstable_cache } from "next/cache";

/**
 * Wrapper hỗ trợ cache hàm với các tags để xóa cache có chọn lọc.
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
 * Pattern Stale-While-Revalidate (SWR)
 * Trả về dữ liệu cũ ngay lập tức và revalidate (cập nhật) ở background.
 */
export function createSWRCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  {
    keyPrefix,
    staleTime = 60, // Mặc định 1 phút (stale)
  }: {
    keyPrefix: string;
    staleTime?: number;
    // revalidateTime?: number; // Removed unused parameter
  }
): T {
  return ((...args: Parameters<T>) => {
    const cacheKey = `swr-${keyPrefix}-${JSON.stringify(args)}`;

    return unstable_cache(
      async () => {
        try {
          return await fn(...args);
        } catch (error) {
          console.error(`[SWR Cache] Lỗi cho key ${cacheKey}:`, error);
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
 * Cache với tính năng tự động "làm nóng" (warming)
 * Chủ động nạp dữ liệu vào cache cho các dữ liệu thường xuyên được truy cập.
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
 * Cơ chế Cache đa lớp (Multi-level caching):
 * 1. Memory cache: Nhanh nhất, tồn tại theo từng request hoặc thời gian ngắn.
 * 2. Next.js cache: Lưu trên server, bền vững hơn (File-system based).
 * 3. API call: Chạy khi cả 2 lớp trên đều không có dữ liệu (Cache miss).
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

    // Lớp 1: Memory cache (Bộ nhớ RAM)
    const memCached = memoryCache.get(cacheKey);
    if (memCached && memCached.expires > now) {
      return memCached.data;
    }

    // Lớp 2: Next.js cache (File system/Persistent)
    const cachedFn = unstable_cache(async () => fn(...args), [cacheKey], {
      tags: [...tags, cacheKey],
      revalidate: cacheTTL,
    });

    const result = await cachedFn();

    // Lưu vào memory cache để dùng lại cực nhanh trong request sau
    memoryCache.set(cacheKey, {
      data: result,
      expires: now + memoryTTL * 1000,
    });

    // Dọn dẹp memory cache cũ nếu vượt quá 100 entries để tránh tốn RAM
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
 * Khử trùng lặp (Deduplication) cho các request đồng thời.
 * Nếu có nhiều request cùng gọi 1 dữ liệu tại 1 thời điểm -> Chỉ thực hiện 1 API call.
 */
const pendingRequests = new Map<string, Promise<any>>();

export function createDedupedCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyPrefix: string
): T {
  return (async (...args: Parameters<T>) => {
    const cacheKey = `${keyPrefix}-${JSON.stringify(args)}`;

    // Trả về request đang chạy nếu có (Tránh gọi trùng)
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }

    // Tạo request mới nếu chưa có cái nào đang chạy
    const promise = fn(...args).finally(() => {
      pendingRequests.delete(cacheKey);
    });

    pendingRequests.set(cacheKey, promise);
    return promise;
  }) as T;
}

/**
 * Gom nhóm các request (Batching)
 * Kết hợp nhiều request lẻ tẻ vào thành một request duy nhất để tối ưu hiệu năng.
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
  const batch: string[] = [];
  const resolvers: Array<(value: T | null) => void> = [];
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
      console.error("[Batch Cache] Lỗi khi thực thi batch:", error);
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
