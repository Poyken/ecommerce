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
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

import { AddressesModule } from '@/addresses/addresses.module';
import { AdminModule } from '@/admin/admin.module';
import { AnalyticsModule } from '@/analytics/analytics.module';
import { AuditInterceptor } from '@/audit/audit.interceptor';
import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { BlogModule } from '@/blog/blog.module';
import { CatalogModule } from '@/catalog/catalog.module'; // NEW
import { CommonModule } from '@/common/common.module';
import { FeatureFlagsModule } from '@/common/feature-flags/feature-flags.module';
import { PromotionsModule } from '@/promotions/promotions.module';
// import { RmaModule } from '@/rma/rma.module'; // REMOVED
import { InventoryModule } from '@/inventory/inventory.module';
import { MediaModule } from '@/media/media.module';
import { CustomerGroupsModule } from '@/customer-groups/customer-groups.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { PagesModule } from '@/pages/pages.module';
import { SalesModule } from '@/sales/sales.module'; // NEW
import { PlansModule } from '@/plans/plans.module';
import { ReviewsModule } from '@/reviews/reviews.module';
import { RolesModule } from '@/roles/roles.module';
import { TenantsModule } from '@/tenants/tenants.module';
import { UsersModule } from '@/users/users.module';
import { WishlistModule } from '@/wishlist/wishlist.module';
import { AppThrottlerGuard } from '@core/guards/app.throttler.guard';
import { CsrfGuard } from '@core/guards/csrf.guard';
import { PrismaModule } from '@core/prisma/prisma.module';
import { RedisModule } from '@core/redis/redis.module';
import { CloudinaryModule } from '@integrations/cloudinary/cloudinary.module';
import { NewsletterModule } from '@integrations/newsletter/newsletter.module';
import { SitemapModule } from '@integrations/sitemap/sitemap.module';
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
import { TenantGuard } from '@core/guards/tenant.guard';
import { JwtModule } from '@nestjs/jwt';
import { SentryModule } from '@core/sentry/sentry.module';
import { DataLoaderModule } from '@core/dataloader/dataloader.module';
import { MetricsModule } from '@core/metrics/metrics.module';
import { SuperAdminModule } from '@/super-admin/super-admin.module';
import { ReturnRequestsModule } from './return-requests/return-requests.module';
import { ProcurementModule } from './procurement/procurement.module';
import { FulfillmentModule } from './fulfillment/fulfillment.module';
import { TaxModule } from './tax/tax.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { DevToolsModule } from './dev-tools/dev-tools.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { ReportsModule } from './reports/reports.module';
import { InventoryAlertsModule } from './inventory-alerts/inventory-alerts.module';

import { z } from 'zod';

// Zod Schema for Environment Variables
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test', 'provision'])
    .default('development'),
  PORT: z.coerce.number().default(8080),

  // Database
  DATABASE_URL: z.string().min(1),

  // Authentication
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRED: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_REFRESH_EXPIRED: z.string().default('7d'),

  // Redis
  REDIS_URL: z.string().min(1),

  // Frontend
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
    AuthModule,

    // 6. UsersModule - Quản lý người dùng
    UsersModule,
    TenantsModule,

    // AddressesModule - Quản lý địa chỉ
    AddressesModule,

    // 7. RolesModule - Quản lý vai trò & quyền hạn (RBAC)
    RolesModule,

    // 8. Catalog Domain
    CatalogModule,
    PlansModule,

    // 9. Sales Domain (Orders, Cart, Payment, Invoices, Shipping)
    SalesModule,

    PagesModule,

    // 12. NotificationsModule - Thông báo (Email, Push)
    NotificationsModule,

    // 13. ReviewsModule - Đánh giá sản phẩm
    ReviewsModule,

    // 14. RedisModule - Cache & Session
    RedisModule,

    // 15. CommonModule - Logger & Cache Services
    CommonModule,

    // 16. NewsletterModule - Đăng ký nhận bản tin
    NewsletterModule,

    // 17. CloudinaryModule - Upload ảnh
    CloudinaryModule,

    AnalyticsModule,

    AuditModule,

    SitemapModule,

    AdminModule,
    SuperAdminModule,

    WishlistModule,

    BlogModule,
    FeatureFlagsModule,
    WorkerModule,
    ScheduleModule.forRoot(),
    ChatModule,

    // AI Domain
    AiModule,

    SentryModule, // Error Tracking & Performance Monitoring
    DataLoaderModule, // N+1 Query Prevention
    MetricsModule, // Prometheus Metrics
    PromotionsModule,
    // RmaModule REMOVED
    InventoryModule,
    MediaModule,
    CustomerGroupsModule,
    ReturnRequestsModule,
    ProcurementModule,
    FulfillmentModule,
    TaxModule,
    LoyaltyModule,
    WebhooksModule,
    DevToolsModule,
    SubscriptionModule,
    ReportsModule,
    InventoryAlertsModule,
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
