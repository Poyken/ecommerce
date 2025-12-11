import { RedisService } from '../redis/redis.service';
export declare class CacheService {
    private readonly redis;
    private readonly DEFAULT_TTL;
    constructor(redis: RedisService);
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    invalidatePattern(pattern: string): Promise<void>;
    getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;
}
