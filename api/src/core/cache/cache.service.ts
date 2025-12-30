import { RedisService } from '@core/redis/redis.service';
import { Injectable } from '@nestjs/common';
import * as zlib from 'zlib';

/**
 * =====================================================================
 * CACHE SERVICE - Dịch vụ quản lý bộ nhớ đệm (Redis)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PERFORMANCE OPTIMIZATION:
 * - Caching giúp giảm tải cho Database chính bằng cách lưu trữ các kết quả truy vấn thường xuyên vào RAM (Redis).
 * - Tốc độ đọc từ RAM nhanh hơn hàng trăm lần so với đọc từ ổ cứng (Disk).
 *
 * 2. CACHE-ASIDE PATTERN:
 * - Hàm `getOrSet` triển khai mẫu thiết kế Cache-aside: Kiểm tra trong Cache trước, nếu không có mới gọi Database và lưu lại vào Cache cho lần sau.
 *
 * 3. TTL (Time To Live):
 * - Mỗi dữ liệu trong cache đều có thời gian sống (`DEFAULT_TTL`). Sau thời gian này, dữ liệu tự động bị xóa để đảm bảo tính cập nhật.
 *
 * 4. CACHE INVALIDATION:
 * - `invalidatePattern`: Dùng để xóa hàng loạt cache khi dữ liệu gốc thay đổi (VD: Khi cập nhật sản phẩm, ta xóa toàn bộ cache liên quan đến sản phẩm đó).
 * =====================================================================
 */
@Injectable()
export class CacheService {
  private readonly DEFAULT_TTL = 300; // 5 phút
  private readonly JITTER_PERCENTAGE = 0.1; // ±10% variance
  private readonly COMPRESSION_THRESHOLD = 5120; // 5KB
  private readonly GZIP_PREFIX = 'gz:';

  constructor(private readonly redis: RedisService) {}

  /**
   * [P1 OPTIMIZATION] Thêm jitter vào TTL để tránh Cache Stampede
   *
   * Cache Stampede xảy ra khi nhiều cache cùng hết hạn một lúc,
   * gây ra đợt request đồng loạt vào database.
   * Jitter phân tán thời gian hết hạn để giảm tải.
   *
   * @param ttl - TTL gốc (seconds)
   * @returns TTL với random jitter ±10%
   */
  private applyJitter(ttl: number): number {
    const jitterRange = ttl * this.JITTER_PERCENTAGE;
    const jitter = Math.random() * jitterRange * 2 - jitterRange; // Range: -10% to +10%
    return Math.round(ttl + jitter);
  }

  /**
   * Lấy giá trị đã cache
   */
  async get<T>(key: string): Promise<T | null> {
    let data = await this.redis.get(key);
    if (!data) return null;

    // [P10 OPTIMIZATION] Handle decompression
    if (data.startsWith(this.GZIP_PREFIX)) {
      try {
        const compressedData = Buffer.from(
          data.slice(this.GZIP_PREFIX.length),
          'base64',
        );
        data = zlib.gunzipSync(compressedData).toString('utf-8');
      } catch (err) {
        // Fallback to raw data if decompression fails
        console.error(
          `[CacheService] Decompression failed for key ${key}`,
          err,
        );
      }
    }

    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  /**
   * Đặt giá trị cache với TTL tùy chọn
   */
  /**
   * [P1 OPTIMIZED] Set với random jitter để tránh cache stampede
   */
  async set(
    key: string,
    value: unknown,
    ttl: number = this.DEFAULT_TTL,
    useJitter: boolean = true,
  ): Promise<void> {
    let serialized = typeof value === 'string' ? value : JSON.stringify(value);

    // [P10 OPTIMIZATION] Compress large payloads
    if (serialized.length > this.COMPRESSION_THRESHOLD) {
      const compressed = zlib.gzipSync(Buffer.from(serialized, 'utf-8'));
      serialized = this.GZIP_PREFIX + compressed.toString('base64');
    }

    const effectiveTtl = useJitter ? this.applyJitter(ttl) : ttl;
    await this.redis.set(key, serialized, 'EX', effectiveTtl);
  }

  /**
   * Xóa giá trị đã cache
   */
  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * [P1 OPTIMIZATION] Xóa tất cả các key khớp với mẫu bằng SCAN (Non-blocking)
   *
   * 📚 GIẢI THÍCH:
   * - Redis `KEYS` là lệnh chặn (blocking), có thể làm treo server nếu database lớn.
   * - `SCAN` cho phép ta duyệt qua database một cách tuần tự mà không gây nghẽn.
   *
   * @param pattern - Ví dụ: 'product:*'
   */
  /**
   * [P1 OPTIMIZED] Xóa tất cả các key khớp với mẫu (Non-blocking)
   * Sử dụng SCAN thay vì KEYS để tránh treo server.
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.scan(pattern);
    if (keys.length > 0) {
      // Chunk to avoid "Too many arguments" error if keys array is huge
      for (let i = 0; i < keys.length; i += 100) {
        const chunk = keys.slice(i, i + 100);
        await this.redis.del(...chunk);
      }
    }
  }

  /**
   * Lấy hoặc đặt cache (mẫu cache-aside)
   * Nếu key tồn tại, trả về giá trị đã cache
   * Ngược lại, gọi hàm factory và cache kết quả
   */
  /**
   * [P1 OPTIMIZED] Lấy hoặc đặt cache với jitter
   * Nếu key tồn tại, trả về giá trị đã cache
   * Ngược lại, gọi hàm factory và cache kết quả với jitter TTL
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL,
    useJitter: boolean = true,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl, useJitter);
    return value;
  }
}
