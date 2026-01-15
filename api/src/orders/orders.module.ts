import { Module, forwardRef } from '@nestjs/common';
import { PaymentModule } from '@/payment/payment.module';
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
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
import { NotificationsModule } from '@/notifications/notifications.module';
import { ProductsModule } from '@/catalog/products/products.module';
import { ShippingModule } from '@/shipping/shipping.module';
import { LoyaltyModule } from '@/loyalty/loyalty.module';
import { PromotionsModule } from '@/promotions/promotions.module';
import { InvoiceService } from './invoice.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

import { BullModule } from '@nestjs/bullmq';
import { OrdersProcessor } from './orders.processor';

import { OrdersExportService } from './orders-export.service';
import { OrdersRepository } from './orders.repository';

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
  ],
  exports: [OrdersRepository, InvoiceService, BullModule],
})
export class OrdersModule {}
