/**
 * =====================================================================
 * APP MODULE - Gốc rễ của toàn bộ ứng dụng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CENTRAL HUB:
 * - Đây là nơi quy tụ tất cả các module con. NestJS xây dựng ứng dụng theo cấu trúc cây, và `AppModule` chính là cái gốc.
 *
 * 2. CONFIGURATION & VALIDATION:
 * - `ConfigModule`: Sử dụng `Joi` để kiểm tra các biến môi trường (`.env`) ngay khi khởi động. Nếu thiếu một biến quan trọng (như `DATABASE_URL`), ứng dụng sẽ báo lỗi và không chạy, giúp tránh lỗi runtime khó tìm.
 *
 * 3. RATE LIMITING (Chống tấn công):
 * - `ThrottlerModule`: Giới hạn số lượng request từ một IP trong một khoảng thời gian. Giúp bảo vệ server khỏi các cuộc tấn công Brute Force hoặc Spam.
 *
 * 4. ASYNC INFRASTRUCTURE:
 * - `BullModule`: Cấu hình kết nối tới Redis để phục vụ cho các hàng đợi (Queue) xử lý tác vụ nặng.
 *
 * 5. GLOBAL PROVIDERS:
 * - `APP_GUARD`: Ta đăng ký `ThrottlerGuard` ở cấp độ toàn cầu để bảo vệ mọi API mà không cần khai báo lại ở từng Controller. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */

import { AuditInterceptor } from '@/audit/audit.interceptor';
import { AuditModule } from '@/audit/audit.module';
import { CatalogModule } from '@/catalog/catalog.module';
import { CmsModule } from '@/cms/cms.module';
import { CommonModule } from '@/common/common.module';
import { FeatureFlagsModule } from '@/common/feature-flags/feature-flags.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { SalesModule } from '@/sales/sales.module';
import { AppThrottlerGuard } from '@core/guards/app.throttler.guard';

import { CsrfGuard } from '@core/guards/csrf.guard';
import { PrismaModule } from '@core/prisma/prisma.module';
import { RedisModule } from '@core/redis/redis.module';
import { BullModule } from '@nestjs/bullmq';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health.controller';

import { WorkerModule } from '@/worker/worker.module';
import { CACHE_CONFIG } from '@core/config/constants';
import { RedisThrottlerStorageService } from '@core/config/throttler/redis-throttler.storage';
import { LoggingInterceptor } from '@core/interceptors/logging.interceptor';
import { CorrelationIdMiddleware } from '@core/middlewares/correlation-id.middleware';
import { RedisService } from '@core/redis/redis.service';
import { IdempotencyInterceptor } from '@core/interceptors/idempotency.interceptor';
import { TenantMiddleware } from '@core/tenant/tenant.middleware';
import { CacheModule } from '@nestjs/cache-manager';
import { AiModule } from '@/ai/ai.module'; // NEW
import { ChatModule } from './chat/chat.module';
import { LockdownGuard } from '@core/guards/lockdown.guard';
import { SuperAdminIpGuard } from '@core/guards/super-admin-ip.guard';
import { IdentityModule } from './identity/identity.module';
import { MarketingModule } from './marketing/marketing.module';
import { OperationsModule } from './operations/operations.module';
import { TenantGuard } from '@core/guards/tenant.guard';
import { JwtModule } from '@nestjs/jwt';
import { SentryModule } from '@core/sentry/sentry.module';
import { DataLoaderModule } from '@core/dataloader/dataloader.module';
import { MetricsModule } from '@core/metrics/metrics.module';
import { TaxModule } from './tax/tax.module';
import { PlatformModule } from '@/platform/platform.module';

import { DevToolsModule } from './dev-tools/dev-tools.module';

import { z } from 'zod';

// Zod Schema for Environment Variables
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test', 'provision'])
    .default('development'),
  PORT: z.coerce.number().default(8080),

  // Database
  DATABASE_URL: z.string().min(1),

  // Authentication - STRICT: Minimum 32 characters for security
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters for security'),
  JWT_ACCESS_EXPIRED: z.string().default('15m'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters for security'),
  JWT_REFRESH_EXPIRED: z.string().default('7d'),

  // Redis
  REDIS_URL: z.string().min(1),

  // Frontend
  FRONTEND_URL: z.string().min(1),

  // Cloudinary - Required in production
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

  // Additional production validation for Cloudinary
  if (data.NODE_ENV === 'production') {
    if (
      !data.CLOUDINARY_CLOUD_NAME ||
      !data.CLOUDINARY_API_KEY ||
      !data.CLOUDINARY_API_SECRET
    ) {
      throw new Error(
        '❌ CLOUDINARY credentials are REQUIRED in production. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.',
      );
    }
  }

  return data;
}

@Module({
  imports: [
    JwtModule.register({}),
    CacheModule.register({
      isGlobal: true,
      ttl: CACHE_CONFIG.DEFAULT_TTL * 1000,
      max: CACHE_CONFIG.MAX_ITEMS,
    }),
    // 1. ConfigModule - Quản lý biến môi trường (.env)
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),

    // 2. ThrottlerModule - Rate Limiting (Chống spam request)
    // Giới hạn: 100 requests mỗi 60 giây (1 phút)

    // 2. ThrottlerModule - Rate Limiting (Chống spam request)
    // Sử dụng Redis Storage để đồng bộ giữa các instances
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [RedisService],
      useFactory: (redisService: RedisService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: 1000, // 1 giây
            limit: 10, // Max 10 request/giây -> Chống burst/bot
          },
          {
            name: 'long',
            ttl: 60000, // 1 phút
            limit: 100, // Max 100 request/phút -> Chống spam diện rộng
          },
        ],
        storage: new RedisThrottlerStorageService(redisService),
      }),
    }),

    // 3. BullModule - Quản lý hàng đợi (Xử lý công việc nền)
    // Sử dụng Redis làm message broker
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get('REDIS_URL') || 'redis://localhost:6379',
        },
      }),
      inject: [ConfigService],
    }),

    // 4. PrismaModule - Database ORM (PostgreSQL)
    PrismaModule,

    // 5. AuthModule - Xác thực & Phân quyền (JWT, Guards)
    // AuthModule, -> Moved to IdentityModule

    // 6. UsersModule - Quản lý người dùng
    // UsersModule, -> Moved to IdentityModule
    // TenantsModule, -> Moved to IdentityModule

    IdentityModule, // Auth, Users, Roles, Tenants, Addresses
    MarketingModule, // Promotions, Loyalty, CustomerGroups
    OperationsModule, // Fulfillment, Procurement, ReturnRequests, Inventory

    // 8. Catalog Domain
    CatalogModule,

    // 9. Sales Domain (Orders, Cart, Payment, Invoices, Shipping, Reviews, Wishlist, Tax)
    SalesModule,

    // Platform Domain (Admin, SuperAdmin, Analytics, Subscriptions, Integrations)
    PlatformModule,

    // Common Infrastructure
    RedisModule,
    CommonModule,
    AuditModule,
    
    // CMS Domain (Blog, Pages, Media)
    CmsModule,
    
    // Domain Modules
    NotificationsModule,

    FeatureFlagsModule,
    WorkerModule,
    ScheduleModule.forRoot(),
    ChatModule,

    // AI Domain
    AiModule,

    SentryModule, // Error Tracking & Performance Monitoring
    DataLoaderModule, // N+1 Query Prevention
    MetricsModule, // Prometheus Metrics
    DevToolsModule,
  ],
  controllers: [HealthController],
  providers: [
    // Global Guard - ThrottlerGuard áp dụng cho toàn bộ API
    // Tự động chặn request vượt quá rate limit
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: LockdownGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SuperAdminIpGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
    // TenantGuard: Auto-validate tenant for @RequireTenant endpoints
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply Correlation ID middleware to all routes
    // This runs before any interceptor and adds correlationId to request
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
