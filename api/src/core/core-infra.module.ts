import { CACHE_CONFIG } from '@core/config/constants';
import { PrismaModule } from '@core/prisma/prisma.module';
import { RedisThrottlerStorageService } from '@core/config/throttler/redis-throttler.storage';
import { RedisModule } from '@core/redis/redis.module';
import { RedisService } from '@core/redis/redis.service';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { z } from 'zod';
import { SentryModule } from '@core/sentry/sentry.module';
import { DataLoaderModule } from '@core/dataloader/dataloader.module';
import { MetricsModule } from '@core/metrics/metrics.module';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test', 'provision']).default('development'),
  PORT: z.coerce.number().default(8080),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  REDIS_URL: z.string().min(1),
  FRONTEND_URL: z.string().min(1),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

function validate(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error('❌ Config validation error: ' + result.error.message);
  }
  const data = result.data;
  if (data.NODE_ENV === 'production') {
    if (!data.CLOUDINARY_CLOUD_NAME || !data.CLOUDINARY_API_KEY || !data.CLOUDINARY_API_SECRET) {
      throw new Error('❌ CLOUDINARY credentials are REQUIRED in production.');
    }
  }
  return data;
}

import { EventEmitterModule } from '@nestjs/event-emitter';

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true, validate }),
    CacheModule.register({
      isGlobal: true,
      ttl: CACHE_CONFIG.DEFAULT_TTL * 1000,
      max: CACHE_CONFIG.MAX_ITEMS,
    }),
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [RedisService],
      useFactory: (redisService: RedisService) => ({
        throttlers: [
          { name: 'short', ttl: 1000, limit: 10 },
          { name: 'long', ttl: 60000, limit: 100 },
        ],
        storage: new RedisThrottlerStorageService(redisService),
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: { url: configService.get('REDIS_URL') || 'redis://localhost:6379' },
      }),
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    SentryModule,
    DataLoaderModule,
    MetricsModule,
  ],
  exports: [
    ConfigModule,
    CacheModule,
    ThrottlerModule,
    BullModule,
    PrismaModule,
    RedisModule,
    SentryModule,
    DataLoaderModule,
    MetricsModule,
  ],
})
export class CoreInfraModule {}
