/**
 * =====================================================================
 * CACHE PUBSUB SERVICE - ĐỒNG BỘ CACHE GIỮA CÁC INSTANCES
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Vấn đề: Khi chạy nhiều server instances (horizontal scaling):
 * - Instance A cập nhật product -> invalidate cache local
 * - Instance B vẫn còn cache cũ -> trả về data lỗi thời!
 *
 * Giải pháp: Redis Pub/Sub
 * - Instance A publish message: "product:123 changed"
 * - Tất cả instances subscribe và nhận message
 * - Mỗi instance tự invalidate cache local
 *
 * Channels:
 * - cache:invalidate:product => Invalidate product cache
 * - cache:invalidate:category => Invalidate category cache
 * - cache:invalidate:order => Invalidate order cache
 * - cache:invalidate:all => Clear all cache (emergency)
 * =====================================================================
 */

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { RedisService } from '@core/redis/redis.service';
import { CacheService } from '@core/cache/cache.service';
import Redis from 'ioredis';

export enum CacheChannel {
  PRODUCT = 'cache:invalidate:product',
  CATEGORY = 'cache:invalidate:category',
  BRAND = 'cache:invalidate:brand',
  ORDER = 'cache:invalidate:order',
  USER = 'cache:invalidate:user',
  ALL = 'cache:invalidate:all',
}

export interface CacheInvalidationMessage {
  channel: CacheChannel;
  pattern?: string; // e.g., 'product:*' or 'product:123'
  keys?: string[]; // specific keys to invalidate
  source: string; // instance ID that sent the message
  timestamp: number;
}

@Injectable()
export class CachePubSubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CachePubSubService.name);
  private subscriber: Redis | null = null;
  private readonly instanceId: string;
  private readonly channels = Object.values(CacheChannel);

  constructor(
    private readonly redis: RedisService,
    private readonly cache: CacheService,
  ) {
    // Generate unique instance ID
    this.instanceId = `instance_${process.pid}_${Date.now()}`;
  }

  async onModuleInit() {
    try {
      // Create a separate connection for subscribing (Redis requirement)
      this.subscriber = this.redis.duplicate();

      // Subscribe to all cache invalidation channels
      await this.subscriber.subscribe(...this.channels);
      this.logger.log(
        `📡 Subscribed to cache channels: ${this.channels.join(', ')}`,
      );

      // Handle incoming messages
      this.subscriber.on('message', (channel: string, message: string) => {
        this.handleMessage(channel as CacheChannel, message);
      });

      this.logger.log(
        `🔗 Cache PubSub initialized (Instance: ${this.instanceId})`,
      );
    } catch (error) {
      this.logger.error('Failed to initialize Cache PubSub', error);
    }
  }

  async onModuleDestroy() {
    if (this.subscriber) {
      await this.subscriber.unsubscribe(...this.channels);
      await this.subscriber.quit();
      this.logger.log('🔌 Cache PubSub disconnected');
    }
  }

  /**
   * Publish cache invalidation message to all instances
   */
  async publish(
    channel: CacheChannel,
    options: { pattern?: string; keys?: string[] } = {},
  ): Promise<void> {
    const message: CacheInvalidationMessage = {
      channel,
      pattern: options.pattern,
      keys: options.keys,
      source: this.instanceId,
      timestamp: Date.now(),
    };

    try {
      await this.redis.publish(channel, JSON.stringify(message));
      this.logger.debug(
        `📤 Published to ${channel}: ${JSON.stringify(options)}`,
      );
    } catch (error) {
      this.logger.error(`Failed to publish to ${channel}`, error);
    }
  }

  /**
   * Handle incoming cache invalidation messages
   */
  private async handleMessage(channel: CacheChannel, rawMessage: string) {
    try {
      const message: CacheInvalidationMessage = JSON.parse(rawMessage);

      // Ignore messages from this instance (already invalidated locally)
      if (message.source === this.instanceId) {
        return;
      }

      this.logger.debug(`📥 Received from ${channel}: ${rawMessage}`);

      // Handle different invalidation strategies
      if (message.keys && message.keys.length > 0) {
        // Invalidate specific keys
        await Promise.all(message.keys.map((key) => this.cache.del(key)));
      } else if (message.pattern) {
        // Invalidate by pattern
        await this.cache.invalidatePattern(message.pattern);
      } else {
        // Invalidate entire channel namespace
        await this.cache.invalidatePattern(`${this.getNamespace(channel)}:*`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle message from ${channel}`, error);
    }
  }

  private getNamespace(channel: CacheChannel): string {
    const namespaceMap: Record<CacheChannel, string> = {
      [CacheChannel.PRODUCT]: 'product',
      [CacheChannel.CATEGORY]: 'category',
      [CacheChannel.BRAND]: 'brand',
      [CacheChannel.ORDER]: 'order',
      [CacheChannel.USER]: 'user',
      [CacheChannel.ALL]: '*',
    };
    return namespaceMap[channel] || '*';
  }

  // =====================================================================
  // CONVENIENCE METHODS
  // =====================================================================

  async invalidateProduct(productId?: string) {
    await this.publish(CacheChannel.PRODUCT, {
      pattern: productId ? `product:${productId}*` : 'product:*',
    });
  }

  async invalidateCategory(categoryId?: string) {
    await this.publish(CacheChannel.CATEGORY, {
      pattern: categoryId ? `category:${categoryId}*` : 'category:*',
    });
  }

  async invalidateOrder(orderId?: string) {
    await this.publish(CacheChannel.ORDER, {
      pattern: orderId ? `order:${orderId}*` : 'order:*',
    });
  }

  async invalidateUser(userId?: string) {
    await this.publish(CacheChannel.USER, {
      pattern: userId ? `user:${userId}*` : 'user:*',
    });
  }

  async invalidateAll() {
    await this.publish(CacheChannel.ALL);
    this.logger.warn('⚠️ Full cache invalidation triggered!');
  }
}
