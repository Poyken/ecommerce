import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

/**
 * CacheService - Lớp caching Redis
 * Cung cấp caching đơn giản với hỗ trợ TTL.
 *
 * Tính năng:
 * - Các thao tác Get/Set với TTL
 * - Tuần tự hóa JSON
 * - Vô hiệu hóa cache
 * - Xóa dựa trên mẫu (Pattern-based deletion)
 */
@Injectable()
export class CacheService {
  private readonly DEFAULT_TTL = 300; // 5 phút

  constructor(private readonly redis: RedisService) {}

  /**
   * Lấy giá trị đã cache
   */
  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    if (!data) return null;

    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  /**
   * Đặt giá trị cache với TTL tùy chọn
   */
  async set(
    key: string,
    value: unknown,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<void> {
    const serialized =
      typeof value === 'string' ? value : JSON.stringify(value);
    await this.redis.set(key, serialized, 'EX', ttl);
  }

  /**
   * Xóa giá trị đã cache
   */
  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * Xóa tất cả các key khớp với mẫu
   * Ví dụ: invalidatePattern('product:*')
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * Lấy hoặc đặt cache (mẫu cache-aside)
   * Nếu key tồn tại, trả về giá trị đã cache
   * Ngược lại, gọi hàm factory và cache kết quả
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }
}
