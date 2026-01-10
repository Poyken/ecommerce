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
 * - `APP_GUARD`: Ta đăng ký `ThrottlerGuard` ở cấp độ toàn cầu để bảo vệ mọi API mà không cần khai báo lại ở từng Controller.
 * =====================================================================
 */

import { AddressesModule } from '@/addresses/addresses.module';
import { AdminModule } from '@/admin/admin.module';
import { AnalyticsModule } from '@/analytics/analytics.module';
import { AuditInterceptor } from '@/audit/audit.interceptor';
import { AuditModule } from '@/audit/audit.module';
import { AuthModule } from '@/auth/auth.module';
import { BlogModule } from '@/blog/blog.module';
import { BrandsModule } from '@/brands/brands.module';
import { CartModule } from '@/cart/cart.module';
import { CategoriesModule } from '@/categories/categories.module';
import { CommonModule } from '@/common/common.module';
import { FeatureFlagsModule } from '@/common/feature-flags/feature-flags.module';
import { CouponsModule } from '@/coupons/coupons.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { OrdersModule } from '@/orders/orders.module';
import { PagesModule } from '@/pages/pages.module';
import { PaymentModule } from '@/payment/payment.module';
import { ProductsModule } from '@/products/products.module';
import { PlansModule } from '@/plans/plans.module';
import { ReviewsModule } from '@/reviews/reviews.module';
import { RolesModule } from '@/roles/roles.module';
import { ShippingModule } from '@/shipping/shipping.module';
import { SkusModule } from '@/skus/skus.module';
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
import * as Joi from 'joi';
import { HealthController } from './health.controller';

import { WorkerModule } from '@/worker/worker.module';
import { CACHE_CONFIG } from '@core/config/constants';
import { RedisThrottlerStorageService } from '@core/config/throttler/redis-throttler.storage';
import { LoggingInterceptor } from '@core/interceptors/logging.interceptor';
import { CorrelationIdMiddleware } from '@core/middlewares/correlation-id.middleware';
import { RedisService } from '@core/redis/redis.service';
import { IdempotencyInterceptor } from '@core/interceptors/idempotency.interceptor';
import { TenantMiddleware } from '@core/tenant/tenant.middleware';
// import { TenantsController } from '@core/tenant/tenants.controller'; // REMOVED
import { CacheModule } from '@nestjs/cache-manager';
import { AiChatModule } from './ai-chat/ai-chat.module';
import { ChatModule } from './chat/chat.module';
import { LockdownGuard } from '@core/guards/lockdown.guard';
import { SuperAdminIpGuard } from '@core/guards/super-admin-ip.guard';
import { JwtModule } from '@nestjs/jwt';
import { AgentModule } from './agent/agent.module';
import { InsightsModule } from './insights/insights.module';
import { ImageProcessorModule } from './images/image-processor.module';
import { RagModule } from './rag/rag.module';
import { SentryModule } from '@core/sentry/sentry.module';
import { DataLoaderModule } from '@core/dataloader/dataloader.module';
import { MetricsModule } from '@core/metrics/metrics.module';

@Module({
  imports: [
    JwtModule.register({}),
    CacheModule.register({
      isGlobal: true,
      ttl: CACHE_CONFIG.DEFAULT_TTL * 1000, // Convert seconds to milliseconds
      max: CACHE_CONFIG.MAX_ITEMS,
    }),
    // 1. ConfigModule - Quản lý biến môi trường (.env)
    // isGlobal: true => Có thể inject ConfigService ở bất kỳ module nào
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'provision')
          .default('development'),
        PORT: Joi.number().default(8080),

        // Database
        DATABASE_URL: Joi.string().required(),

        // Authentication
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRED: Joi.string().default('15m'),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_REFRESH_EXPIRED: Joi.string().default('7d'),

        // Redis
        REDIS_URL: Joi.string().required(),

        // Frontend
        FRONTEND_URL: Joi.string().required(),
      }),
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

    // 8. Các Module liên quan đến sản phẩm - Quản lý sản phẩm
    CategoriesModule, // Danh mục sản phẩm
    BrandsModule, // Thương hiệu
    ProductsModule, // Sản phẩm
    SkusModule, // Biến thể sản phẩm (SKU - Stock Keeping Unit)
    PlansModule,
    // 9. CartModule - Giỏ hàng
    CartModule,

    // 10. OrdersModule - Đơn hàng
    OrdersModule,
    PagesModule,

    // 11. PaymentModule - Thanh toán
    PaymentModule,

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

    CouponsModule,

    AnalyticsModule,

    AuditModule,

    SitemapModule,

    AdminModule,

    ShippingModule,

    WishlistModule,

    BlogModule,
    FeatureFlagsModule,
    WorkerModule,
    ScheduleModule.forRoot(),
    ChatModule,
    AiChatModule,
    AgentModule, // AI Agent System
    InsightsModule, // AI Business Insights
    ImageProcessorModule, // AI Image Enhancement
    RagModule, // RAG Chatbot
    SentryModule, // Error Tracking & Performance Monitoring
    DataLoaderModule, // N+1 Query Prevention
    MetricsModule, // Prometheus Metrics
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
