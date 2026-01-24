import { RedisService } from '@core/redis/redis.service';
import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';

/**
 * =====================================================================
 * REDIS THROTTLER STORAGE - LƯU TRỮ GIỚI HẠN TỐC ĐỘ TRÊN REDIS
 * =====================================================================
 *
 * =====================================================================
 */

/**
 * Interface for Throttler Storage Record
 * Copied from @nestjs/throttler definitions to avoid import issues
 */
export interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlock: number;
  timeToBlockExpire: number;
}

@Injectable()
export class RedisThrottlerStorageService implements ThrottlerStorage {
  constructor(private readonly redisService: RedisService) {}

  async increment(
    key: string,
    ttl: number, // TTL in milliseconds
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const redisKey = `throttle:${key}`;
    const ttlSeconds = Math.ceil(ttl / 1000);
    const client = this.redisService.client;

    // Execute atomic increment and get TTL
    const multi = client.multi();
    multi.incr(redisKey);
    multi.ttl(redisKey);

    const results = await multi.exec();

    if (!results) {
      throw new Error('Redis transaction failed');
    }

    const [errIncr, totalHits] = results[0];
    const [errTtl, currentTtl] = results[1];

    if (errIncr || errTtl) {
      throw new Error('Redis internal error');
    }

    const hits = totalHits as number;
    let ttlValue = currentTtl as number;

    // Set TTL if it's a new key or has no expiry
    if (hits === 1 || ttlValue === -1) {
      await client.expire(redisKey, ttlSeconds);
      ttlValue = ttlSeconds;
    }

    return {
      totalHits: hits,
      timeToExpire: ttlValue * 1000,
      isBlocked: false, // Simple implementation, blocking logic handled by Guard
      timeToBlock: 0,
      timeToBlockExpire: 0,
    };
  }
}
