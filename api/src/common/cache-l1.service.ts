import { Injectable } from '@nestjs/common';

/**
 * =====================================================================
 * L1 CACHE SERVICE - Bộ nhớ đệm tầng 1 (RAM)
 * =====================================================================
 *
 * =====================================================================
 */
@Injectable()
export class CacheL1Service {
  private cache = new Map<string, { value: any; expiry: number }>();

  /**
   * Lấy dữ liệu từ RAM
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * Lưu dữ liệu vào RAM
   * @param ttl Seconds (default: 15s)
   */
  set(key: string, value: any, ttl = 15): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl * 1000,
    });

    // Cleanup logic if map grows too large
    if (this.cache.size > 1000) {
      this.cache.clear();
    }
  }

  /**
   * Xóa một key cụ thể
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Xóa toàn bộ L1 cache
   */
  clear(): void {
    this.cache.clear();
  }
}
