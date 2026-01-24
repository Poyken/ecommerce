import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * =====================================================================
 * ENHANCED REDIS SERVICE - QUẢN LÝ CƠ SỞ DỮ LIỆU TẠM THỜI (CACHE)
 * =====================================================================
 *
 * =====================================================================
 */

@Injectable()
export class EnhancedRedisService {
  private readonly logger = new Logger(EnhancedRedisService.name);
  private readonly redis: Redis;
  private readonly subscriber: Redis;
  private circuitBreakerOpen = false;
  private failureCount = 0;
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 30000; // 30s

  constructor(private readonly configService: ConfigService) {
    const redisUrl =
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

    // Main connection with automatic reconnection
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: true,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    });

    // Separate subscriber connection for pub/sub
    this.subscriber = new Redis(redisUrl);

    // Monitor connection health
    this.redis.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err.message}`);
      this.handleCircuitBreaker();
    });

    this.redis.on('connect', () => {
      this.logger.log('✅ Redis connected');
      this.resetCircuitBreaker();
    });
  }

  /**
   * Circuit breaker pattern for Redis failures
   */
  private handleCircuitBreaker() {
    this.failureCount++;
    if (this.failureCount >= this.CIRCUIT_BREAKER_THRESHOLD) {
      this.circuitBreakerOpen = true;
      this.logger.warn('🔴 Circuit breaker OPEN - Redis calls disabled');

      setTimeout(() => {
        this.logger.log('🟡 Circuit breaker attempting to close');
        this.circuitBreakerOpen = false;
        this.failureCount = 0;
      }, this.CIRCUIT_BREAKER_TIMEOUT);
    }
  }

  private resetCircuitBreaker() {
    this.circuitBreakerOpen = false;
    this.failureCount = 0;
  }

  /**
   * Get with fallback
   */
  async get(key: string): Promise<string | null> {
    if (this.circuitBreakerOpen) return null;

    try {
      return await this.redis.get(key);
    } catch (error) {
      this.logger.error(`Redis GET error for key ${key}: ${error.message}`);
      this.handleCircuitBreaker();
      return null;
    }
  }

  /**
   * Set with TTL (cache-aside pattern)
   */
  async set(
    key: string,
    value: string,
    mode?: 'EX' | 'PX',
    duration?: number,
  ): Promise<'OK' | null> {
    if (this.circuitBreakerOpen) return null;

    try {
      if (mode && duration) {
        if (mode === 'EX') {
          await this.redis.setex(key, duration, value);
          return 'OK';
        } else {
          await this.redis.psetex(key, duration, value);
          return 'OK';
        }
      }
      return await this.redis.set(key, value);
    } catch (error) {
      this.logger.error(`Redis SET error for key ${key}: ${error.message}`);
      this.handleCircuitBreaker();
      return null;
    }
  }

  /**
   * Delete key(s) - supports pattern matching
   */
  async del(...keys: string[]): Promise<number> {
    if (this.circuitBreakerOpen) return 0;

    try {
      return await this.redis.del(...keys);
    } catch (error) {
      this.logger.error(`Redis DEL error: ${error.message}`);
      this.handleCircuitBreaker();
      return 0;
    }
  }

  /**
   * Delete keys by pattern (distributed cache invalidation)
   */
  async delPattern(pattern: string): Promise<number> {
    if (this.circuitBreakerOpen) return 0;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;

      // Use pipeline for better performance
      const pipeline = this.redis.pipeline();
      keys.forEach((key) => pipeline.del(key));
      await pipeline.exec();

      this.logger.log(
        `Deleted ${keys.length} keys matching pattern: ${pattern}`,
      );
      return keys.length;
    } catch (error) {
      this.logger.error(`Redis DEL pattern error: ${error.message}`);
      this.handleCircuitBreaker();
      return 0;
    }
  }

  /**
   * Cache warming - preload frequently accessed data
   */
  async warmCache(key: string, dataFetcher: () => Promise<any>, ttl = 3600) {
    const data = await dataFetcher();
    if (data) {
      await this.set(key, JSON.stringify(data), 'EX', ttl);
      this.logger.log(`Cache warmed for key: ${key}`);
    }
  }

  /**
   * Pub/Sub for distributed cache invalidation
   */
  async publish(channel: string, message: string) {
    if (this.circuitBreakerOpen) return;

    try {
      await this.redis.publish(channel, message);
    } catch (error) {
      this.logger.error(`Redis PUBLISH error: ${error.message}`);
    }
  }

  async subscribe(channel: string, callback: (message: string) => void) {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, msg) => {
      if (ch === channel) {
        callback(msg);
      }
    });
  }

  /**
   * Health check
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  /**
   * Cleanup on shutdown
   */
  async onModuleDestroy() {
    await this.redis.quit();
    await this.subscriber.quit();
    this.logger.log('Redis connections closed');
  }
}
