import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { JwtModule } from '@nestjs/jwt';

import { HealthController } from './health.controller';
import { IdentityModule } from './identity/identity.module';
import { MarketingModule } from './marketing/marketing.module';
import { OperationsModule } from './operations/operations.module';
import { CatalogModule } from './catalog/catalog.module';
import { SalesModule } from './sales/sales.module';
import { CmsModule } from './cms/cms.module';
import { PlatformModule } from './platform/platform.module';
import { AiModule } from '@/ai/ai.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { AuditModule } from '@/audit/audit.module';
import { CommonModule } from '@/common/common.module';
import { FeatureFlagsModule } from '@/common/feature-flags/feature-flags.module';
import { WorkerModule } from '@/worker/worker.module';
import { DevToolsModule } from './dev-tools/dev-tools.module';

import { PrismaModule } from '@core/prisma/prisma.module';
import { RedisModule } from '@core/redis/redis.module';
import { DataLoaderModule } from '@core/dataloader/dataloader.module';
import { MetricsModule } from '@core/metrics/metrics.module';

import { CorrelationIdMiddleware } from '@core/middlewares/correlation-id.middleware';
import { TenantMiddleware } from '@core/tenant/tenant.middleware';
import { AppThrottlerGuard } from '@core/guards/app.throttler.guard';
import { LockdownGuard } from '@core/guards/lockdown.guard';
import { SuperAdminIpGuard } from '@core/guards/super-admin-ip.guard';
import { CsrfGuard } from '@core/guards/csrf.guard';
import { TenantGuard } from '@core/guards/tenant.guard';
import { LoggingInterceptor } from '@core/interceptors/logging.interceptor';
import { AuditInterceptor } from '@/audit/audit.interceptor';
import { IdempotencyInterceptor } from '@core/interceptors/idempotency.interceptor';
import { RedisThrottlerStorageService } from '@core/config/throttler/redis-throttler.storage';
import { RedisService } from '@core/redis/redis.service';
import { CACHE_CONFIG } from '@core/config/constants';

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test', 'provision'])
    .default('development'),
  PORT: z.coerce.number().default(8080),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  REDIS_URL: z.string().min(1),
  FRONTEND_URL: z.string().min(1),
});

function validate(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error('Config validation error: ' + result.error.message);
  }
  return result.data;
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    JwtModule.register({ global: true }),
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
        connection: {
          url: configService.get('REDIS_URL') || 'redis://localhost:6379',
        },
      }),
    }),

    // Core & Infra
    PrismaModule,
    RedisModule,
    DataLoaderModule,
    MetricsModule,

    // Domain Modules
    IdentityModule,
    MarketingModule,
    OperationsModule,
    CatalogModule,
    SalesModule,
    CmsModule,
    PlatformModule,
    AiModule,
    ChatModule,

    // Shared & Support
    NotificationsModule,
    AuditModule,
    CommonModule,
    FeatureFlagsModule,
    WorkerModule,
    DevToolsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
    { provide: APP_GUARD, useClass: LockdownGuard },
    { provide: APP_GUARD, useClass: SuperAdminIpGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
