import { RedisService } from '@core/redis/redis.service';
import { Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(CacheService.name);
  private readonly DEFAULT_TTL = 300; // 5 phút
  private readonly JITTER_PERCENTAGE = 0.1; // ±10% variance
  private readonly COMPRESSION_THRESHOLD = 5120; // 5KB
  private readonly GZIP_PREFIX = 'gz:';
  private readonly TAG_PREFIX = 'tag:'; // 📚 Set tag:name chứa danh sách các keys thuộc tag đó

  /**
   * [P17 OPTIMIZATION] L1 CACHE (Server Memory)
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   * - L1 Cache lưu ngay trong RAM của Node.js instance.
   * - Tốc độ truy xuất gần như = 0ms vì không mất công truyền qua mạng tới Redis.
   * - Tuy nhiên, RAM server có hạn và không đồng bộ giữa các instance, nên ta chỉ lưu Hot Data trong thời gian cực ngắn (L1_TTL).
   */
  private readonly l1Cache = new Map<string, { value: any; expiry: number }>();
  private readonly L1_TTL = 10; // 10 giây
  private readonly L1_MAX_SIZE = 1000;

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
    // 1. Check L1 (In-memory) first
    const l1Entry = this.l1Cache.get(key);
    if (l1Entry && l1Entry.expiry > Date.now()) {
      return l1Entry.value as T;
    }

    // 2. Check L2 (Redis)
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
        this.logger.error(`Decompression failed for key ${key}`, err);
      }
    }

    try {
      const parsed = JSON.parse(data) as T;

      // Update L1 for next time
      this.updateL1(key, parsed);

      return parsed;
    } catch {
      this.updateL1(key, data);
      return data as unknown as T;
    }
  }

  private updateL1(key: string, value: any) {
    if (this.l1Cache.size >= this.L1_MAX_SIZE) {
      const firstKey = this.l1Cache.keys().next().value;
      if (firstKey) this.l1Cache.delete(firstKey);
    }
    this.l1Cache.set(key, {
      value,
      expiry: Date.now() + this.L1_TTL * 1000,
    });
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

    // [P16 OPTIMIZATION] Auto-tagging
    if (key.startsWith('products:')) await this.tagKey(key, 'products');
    if (key.startsWith('categories:')) await this.tagKey(key, 'categories');
  }

  /**
   * [P16 OPTIMIZATION] Gắn nhãn (Tag) cho một Key
   * Giúp xóa hàng loạt các key liên quan mà không cần dùng SCAN (nhanh hơn).
   */
  async tagKey(key: string, ...tags: string[]): Promise<void> {
    const multi = this.redis.client.multi();
    for (const tag of tags) {
      multi.sadd(`${this.TAG_PREFIX}${tag}`, key);
      multi.expire(`${this.TAG_PREFIX}${tag}`, 86400 * 7); // Tag set sống 7 ngày
    }
    await multi.exec();
  }

  /**
   * [P16 OPTIMIZATION] Xóa toàn bộ cache theo Tag
   * Ví dụ: invalidateTag('products') -> Xóa sạch cache của mọi product.
   */
  async invalidateTag(tag: string): Promise<void> {
    const tagName = `${this.TAG_PREFIX}${tag}`;
    const keys = await this.redis.client.smembers(tagName);

    if (keys.length > 0) {
      // Xóa các key trong tag và bản thân tag set
      await Promise.all([this.redis.del(...keys), this.redis.del(tagName)]);
      this.logger.log(`Invalidated tag: ${tag} (${keys.length} keys)`);
    }
  }

  /**
   * Xóa giá trị đã cache
   */
  async del(key: string): Promise<void> {
    this.l1Cache.delete(key);
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
    // Clear L1 (với pattern đơn giản, ta clear sạch L1 cho an toàn)
    this.l1Cache.clear();

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
