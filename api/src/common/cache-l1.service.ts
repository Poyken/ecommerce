import { Injectable } from '@nestjs/common';

/**
 * =====================================================================
 * L1 CACHE SERVICE - Bộ nhớ đệm tầng 1 (RAM)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. HYBRID CACHING (Caching 2 tầng):
 * - Tầng 1 (L1): RAM của chính ứng dụng (Service này). Cực nhanh (nanoseconds), không tốn network.
 * - Tầng 2 (L2): Redis. Nhanh (milliseconds), tốn network, nhưng dùng chung giữa nhiều instance.
 *
 * 2. TẠI SAO CẦN L1?
 * - Có những dữ liệu như Feature Flags được check hàng chục lần TRONG MỘT request.
 * - Việc gọi tới Redis liên tục vẫn tạo ra một chút latency (network round-trip).
 * - L1 giúp giảm tải 100% network cho các check lặp lại trong thời gian ngắn.
 *
 * 3. SHORT TTL:
 * - Dữ liệu ở L1 chỉ nên sống rất ngắn (vd: 10-30s) để đảm bảo không bị "lệch" quá lâu so với L2. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

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
