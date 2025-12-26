import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';

/**
 * =====================================================================
 * REDIS SERVICE - Dịch vụ kết nối cơ sở dữ liệu RAM (Redis)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. WHY REDIS?:
 * - Redis lưu trữ dữ liệu trên RAM, giúp truy xuất cực nhanh (dưới 1ms).
 * - Thường dùng để lưu Session, Token, Cache hoặc các dữ liệu tạm thời.
 *

 * 3. LIFECYCLE HOOKS:
 * - `OnModuleInit`: Tự động chạy khi module khởi tạo, dùng để thiết lập kết nối.
 * - `OnModuleDestroy`: Tự động chạy khi ứng dụng tắt, dùng để ngắt kết nối an toàn (Graceful Shutdown).
 *
 * 4. PROXY METHODS:
 * - Lớp này bọc lại các hàm của `ioredis` (set, get, del) để ta có thể dễ dàng thay đổi thư viện hoặc thêm logic logging/monitoring sau này.
 * =====================================================================
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public client: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.client = new Redis(redisUrl);
  }

  onModuleInit() {
    this.client.on('connect', () => {
      this.logger.log('Redis đã kết nối thành công');
    });
    this.client.on('error', (err) => {
      this.logger.error('Kết nối Redis thất bại', err);
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  // Proxy methods used in Auth
  async set(key: string, value: string, mode?: string, duration?: number) {
    if (mode && duration) {
      return this.client.set(key, value, mode as any, duration);
    }
    return this.client.set(key, value);
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async del(...args: string[]) {
    return this.client.del(...args);
  }

  async keys(pattern: string) {
    return this.client.keys(pattern);
  }

  async flushall() {
    return this.client.flushall();
  }

  async ping() {
    return this.client.ping();
  }
}
