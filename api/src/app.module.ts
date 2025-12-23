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

import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';
import { AddressesModule } from './addresses/addresses.module';
import { AdminModule } from './admin/admin.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuditInterceptor } from './audit/audit.interceptor';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { BlogModule } from './blog/blog.module';
import { CartModule } from './cart/cart.module';
import { CloudinaryModule } from './common/cloudinary/cloudinary.module';
import { CommonModule } from './common/common.module';
import { SitemapModule } from './common/sitemap/sitemap.module';
import { CouponsModule } from './coupons/coupons.module';
import { HealthController } from './health.controller';
import { NewsletterModule } from './newsletter/newsletter.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentModule } from './payment/payment.module';
import { PrismaModule } from './prisma/prisma.module';
import { BrandsModule } from './products/brands/brands.module';
import { CategoriesModule } from './products/categories/categories.module';
import { ProductsModule } from './products/products/products.module';
import { SkusModule } from './products/skus/skus.module';
import { RedisModule } from './redis/redis.module';
import { ReviewsModule } from './reviews/reviews.module';
import { RolesModule } from './roles/roles.module';
import { ShippingModule } from './shipping/shipping.module';
import { UsersModule } from './users/users.module';
import { WishlistModule } from './wishlist/wishlist.module';

@Module({
  imports: [
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
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),

        // Frontend
        FRONTEND_URL: Joi.string().required(),
      }),
    }),

    // 2. ThrottlerModule - Rate Limiting (Chống spam request)
    // Giới hạn: 100 requests mỗi 60 giây (1 phút)
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Thời gian sống: 60 giây
        limit: 100, // Tối đa 100 yêu cầu mỗi cửa sổ TTL
      },
    ]),

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

    // AddressesModule - Quản lý địa chỉ
    AddressesModule,

    // 7. RolesModule - Quản lý vai trò & quyền hạn (RBAC)
    RolesModule,

    // 8. Các Module liên quan đến sản phẩm - Quản lý sản phẩm
    CategoriesModule, // Danh mục sản phẩm
    BrandsModule, // Thương hiệu
    ProductsModule, // Sản phẩm
    SkusModule, // Biến thể sản phẩm (SKU - Stock Keeping Unit)

    // 9. CartModule - Giỏ hàng
    CartModule,

    // 10. OrdersModule - Đơn hàng
    OrdersModule,

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
  ],
  controllers: [HealthController],
  providers: [
    // Global Guard - ThrottlerGuard áp dụng cho toàn bộ API
    // Tự động chặn request vượt quá rate limit
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
