import { Module, forwardRef } from '@nestjs/common';
import { PaymentModule } from '@/sales/payment/payment.module';
import { PrismaModule } from '@core/prisma/prisma.module';

/**
 * =====================================================================
 * ORDERS MODULE - Module quản lý đơn hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CROSS-MODULE INTEGRATION:
 * - `OrdersModule` là nơi giao thoa của nhiều module khác:
 *   - `PrismaModule`: Lưu trữ dữ liệu đơn hàng.
 *   - `PaymentModule`: Xử lý thanh toán.
 *   - `NotificationsModule`: Gửi email/thông báo cho khách hàng.
 *
 * 2. CENTRALIZED LOGIC:
 * - Gom nhóm tất cả logic liên quan đến vòng đời của một đơn hàng (từ lúc tạo đến lúc giao thành công). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */
import { NotificationsModule } from '@/notifications/notifications.module';
import { ProductsModule } from '@/catalog/products/products.module';
import { ShippingModule } from '@/sales/shipping/shipping.module';
import { LoyaltyModule } from '@/marketing/loyalty/loyalty.module';
import { PromotionsModule } from '@/marketing/promotions/promotions.module';
import { InvoiceService } from './invoice.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

import { BullModule } from '@nestjs/bullmq';
import { OrdersProcessor } from './orders.processor';

import { OrdersExportService } from './orders-export.service';
import { OrdersRepository } from './orders.repository';

import { OrderSubscriber } from './order.subscriber';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => PaymentModule),
    NotificationsModule,
    PromotionsModule,
    ShippingModule,
    ProductsModule,
    LoyaltyModule,
    BullModule.registerQueue({
      name: 'orders-queue',
    }),
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrdersRepository,
    InvoiceService,
    OrdersProcessor,
    OrdersExportService,
    OrderSubscriber,
  ],
  exports: [OrdersRepository, InvoiceService, BullModule, OrdersService],
})
export class OrdersModule {}
