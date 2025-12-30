import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis, { Cluster } from 'ioredis';

/**
 * =====================================================================
 * REDIS SERVICE - HỆ THỐNG CACHING & LƯU TRỮ TẠM THỜI
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TẠI SAO DÙNG REDIS?
 * - DB (PostgreSQL) truy xuất ổ cứng nên khá chậm. Redis lưu dữ liệu trên RAM nên tốc độ cực nhanh (Microseconds).
 * - Dùng để cache kết quả API, session người dùng, hoặc các biến đếm (Throttling).
 *
 * 2. CLUSTER VS SINGLE:
 * - Local/Dev: Dùng 1 instance duy nhất cho đơn giản.
 * - Production: Dùng Redis Cluster (nhiều node) để đảm bảo High Availability (Hệ thống vẫn chạy nếu 1 node chết).
 *
 * 3. SCAN VS KEYS (CỰC KỲ QUAN TRỌNG):
 * - TUYỆT ĐỐI không dùng lệnh `KEYS *` trong production vì nó sẽ quét toàn bộ RAM, làm treo Redis (Single-threaded).
 * - Luôn dùng `SCAN` để duyệt key theo từng đợt nhỏ (Batching), đảm bảo không gây nghẽn hệ thống.
 *
 * 4. RETRY STRATEGY:
 * - Khi mất kết nối, hệ thống tự động thử lại (Retry) với độ trễ tăng dần để tránh làm quá tải server khi nó vừa sống dậy.
 * =====================================================================
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public client: Redis | Cluster;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const isCluster = process.env.REDIS_CLUSTER === 'true';

    if (isCluster) {
      // Redis Cluster Configuration (for production scale)
      const nodes = process.env.REDIS_CLUSTER_NODES?.split(',') || [];
      this.client = new Cluster(
        nodes.map((node) => {
          const [host, port] = node.split(':');
          return { host, port: parseInt(port) };
        }),
        {
          redisOptions: {
            password: process.env.REDIS_PASSWORD,
            tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
          },
          clusterRetryStrategy: (times) => {
            if (times > 3) {
              this.logger.error('Redis Cluster max retries reached');
              return null;
            }
            return Math.min(times * 100, 3000);
          },
        },
      );
    } else {
      // Single Redis Instance with Production Config
      this.client = new Redis(redisUrl, {
        // ============================================================
        // RETRY STRATEGY
        // ============================================================
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.error('Redis max retries reached');
            return null; // Stop retrying
          }
          // Exponential backoff: 100ms, 200ms, 300ms
          return Math.min(times * 100, 3000);
        },

        // ============================================================
        // CONNECTION MANAGEMENT
        // ============================================================
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: true,
        lazyConnect: false,

        // ============================================================
        // PERFORMANCE TUNING
        // ============================================================
        connectTimeout: 10000, // 10s timeout for initial connection
        keepAlive: 30000, // Keep connection alive with ping every 30s
        family: 4, // Force IPv4 (faster DNS resolution)

        // ============================================================
        // SECURITY
        // ============================================================
        tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
        password: process.env.REDIS_PASSWORD,
      });
    }
  }

  onModuleInit() {
    // ============================================================
    // CONNECTION EVENT LISTENERS
    // ============================================================
    this.client.on('connect', () => {
      this.logger.log('✅ Redis connected successfully');
    });

    this.client.on('ready', () => {
      this.logger.log('✅ Redis ready to accept commands');
    });

    this.client.on('error', (err) => {
      this.logger.error(`❌ Redis error: ${err.message}`);
    });

    this.client.on('close', () => {
      this.logger.warn('⚠️ Redis connection closed');
    });

    this.client.on('reconnecting', (delay) => {
      this.logger.warn(`🔄 Redis reconnecting in ${delay}ms`);
    });

    this.client.on('end', () => {
      this.logger.warn('Redis connection ended');
    });
  }

  async onModuleDestroy() {
    try {
      // Graceful shutdown: wait for pending commands
      await this.client.quit();
      this.logger.log('✅ Redis disconnected gracefully');
    } catch (error) {
      this.logger.error('Error during Redis shutdown:', error);
      // Force disconnect if graceful shutdown fails
      this.client.disconnect();
    }
  }

  // ============================================================
  // BASIC OPERATIONS WITH ERROR HANDLING
  // ============================================================

  async set(
    key: string,
    value: string,
    mode?: string,
    duration?: number,
  ): Promise<'OK' | null> {
    try {
      if (mode && duration) {
        return await this.client.set(key, value, mode as any, duration);
      }
      return await this.client.set(key, value);
    } catch (error) {
      this.logger.error(`Redis SET failed for key: ${key}`, error);
      return null;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(`Redis GET failed for key: ${key}`, error);
      return null;
    }
  }

  async del(...keys: string[]): Promise<number> {
    try {
      return await this.client.del(...keys);
    } catch (error) {
      this.logger.error(`Redis DEL failed for keys: ${keys.join(',')}`, error);
      return 0;
    }
  }

  // ============================================================
  // BATCH OPERATIONS (Better Performance)
  // ============================================================

  /**
   * Get multiple keys at once - Much faster than multiple GET calls
   */
  async mget(...keys: string[]): Promise<(string | null)[]> {
    try {
      return await this.client.mget(...keys);
    } catch (error) {
      this.logger.error('Redis MGET failed', error);
      return Array(keys.length).fill(null);
    }
  }

  /**
   * Set multiple key-value pairs at once - Atomic operation
   */
  async mset(pairs: Record<string, string>): Promise<'OK' | null> {
    try {
      const args = Object.entries(pairs).flat();
      return await this.client.mset(...args);
    } catch (error) {
      this.logger.error('Redis MSET failed', error);
      return null;
    }
  }

  // ============================================================
  // PATTERN MATCHING (Production-Safe)
  // ============================================================

  /**
   * ⚠️ WARNING: KEYS command blocks Redis!
   * Use SCAN instead for production
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      this.logger.warn(
        `Using KEYS command with pattern: ${pattern} - Consider using scan() instead`,
      );
      return await this.client.keys(pattern);
    } catch (error) {
      this.logger.error(`Redis KEYS failed for pattern: ${pattern}`, error);
      return [];
    }
  }

  /**
   * ✅ RECOMMENDED: Non-blocking alternative to KEYS
   * Use this in production!
   */
  async scan(pattern: string, count: number = 100): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    try {
      do {
        const [newCursor, matchedKeys] = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          count,
        );
        cursor = newCursor;
        keys.push(...matchedKeys);
      } while (cursor !== '0');

      return keys;
    } catch (error) {
      this.logger.error(`Redis SCAN failed for pattern: ${pattern}`, error);
      return keys;
    }
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  async flushall(): Promise<'OK' | null> {
    try {
      this.logger.warn(
        '⚠️ FLUSHALL command executed - all data will be deleted',
      );
      return await this.client.flushall();
    } catch (error) {
      this.logger.error('Redis FLUSHALL failed', error);
      return null;
    }
  }

  async ping(): Promise<'PONG' | null> {
    try {
      return await this.client.ping();
    } catch (error) {
      this.logger.error('Redis PING failed', error);
      return null;
    }
  }

  // ============================================================
  // HEALTH CHECK (for monitoring systems)
  // ============================================================

  async healthCheck(): Promise<{
    healthy: boolean;
    latency?: number;
    error?: string;
  }> {
    try {
      const start = Date.now();
      const result = await this.ping();
      const latency = Date.now() - start;

      if (result === 'PONG') {
        return { healthy: true, latency };
      }

      return { healthy: false, error: 'PING failed' };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================
  // ADVANCED OPERATIONS
  // ============================================================

  /**
   * Set with expiration (seconds)
   */
  async setex(
    key: string,
    seconds: number,
    value: string,
  ): Promise<'OK' | null> {
    try {
      return await this.client.setex(key, seconds, value);
    } catch (error) {
      this.logger.error(`Redis SETEX failed for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Increment counter (atomic)
   */
  async incr(key: string): Promise<number | null> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      this.logger.error(`Redis INCR failed for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Check if key exists
   */
  async exists(...keys: string[]): Promise<number> {
    try {
      return await this.client.exists(...keys);
    } catch (error) {
      this.logger.error('Redis EXISTS failed', error);
      return 0;
    }
  }

  /**
   * Get TTL of a key (in seconds)
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Redis TTL failed for key: ${key}`, error);
      return -1;
    }
  }
}
