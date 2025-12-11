/**
 * AppModule - Root Module của ứng dụng E-commerce API
 *
 * Module này là điểm khởi đầu của toàn bộ ứng dụng NestJS.
 * Nó import và cấu hình tất cả các module con, middleware, guards, và providers toàn cục.
 */

import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';
import { AddressesModule } from './addresses/addresses.module';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { CommonModule } from './common/common.module';
import { HealthController } from './health.controller';
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
import { UsersModule } from './users/users.module';

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
          host: configService.get('REDIS_HOST') || 'localhost',
          port: configService.get('REDIS_PORT') || 6379,
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
  ],
  controllers: [HealthController],
  providers: [
    // Global Guard - ThrottlerGuard áp dụng cho toàn bộ API
    // Tự động chặn request vượt quá rate limit
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
