import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * =====================================================================
 * BULLMQ CONFIGURATION - QUẢN LÝ TÁC VỤ CHẠY NGẦM
 * =====================================================================
 *
 * =====================================================================
 */

export const bullMQConfig = BullModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    connection: {
      host: configService.get('REDIS_HOST', 'localhost'),
      port: configService.get('REDIS_PORT', 6379),
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: true,
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
        count: 1000, // Keep max 1000 completed jobs
      },
      removeOnFail: {
        age: 86400, // Keep failed jobs for 24 hours
        count: 5000,
      },
    },
  }),
  inject: [ConfigService],
});

/**
 * Email Queue Configuration
 * High priority, low latency
 */
export const emailQueueConfig = {
  name: 'email-queue',
  options: {
    defaultJobOptions: {
      priority: 1,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
    limiter: {
      max: 100, // Max 100 jobs
      duration: 1000, // Per second
    },
  },
  processors: {
    concurrency: 10, // Process 10 jobs concurrently
  },
};

/**
 * Orders Queue Configuration
 * Critical operations, ensure reliability
 */
export const ordersQueueConfig = {
  name: 'orders-queue',
  options: {
    defaultJobOptions: {
      priority: 2,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
    },
    limiter: {
      max: 50,
      duration: 1000,
    },
  },
  processors: {
    concurrency: 5,
    lockDuration: 30000, // 30s lock
    stalledInterval: 30000,
    maxStalledCount: 3,
  },
};

/**
 * Notifications Queue Configuration
 * Lower priority, can tolerate delays
 */
export const notificationsQueueConfig = {
  name: 'notifications-queue',
  options: {
    defaultJobOptions: {
      priority: 5,
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 5000,
      },
    },
    limiter: {
      max: 200,
      duration: 1000,
    },
  },
  processors: {
    concurrency: 20,
  },
};

/**
 * Analytics Queue Configuration
 * Batch processing, eventual consistency OK
 */
export const analyticsQueueConfig = {
  name: 'analytics-queue',
  options: {
    defaultJobOptions: {
      priority: 10,
      attempts: 1,
      removeOnComplete: true,
    },
    limiter: {
      max: 500,
      duration: 1000,
    },
  },
  processors: {
    concurrency: 30,
  },
};
