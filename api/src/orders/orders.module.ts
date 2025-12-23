import { Module } from '@nestjs/common';
import { PaymentModule } from 'src/payment/payment.module';
import { PrismaModule } from 'src/prisma/prisma.module';

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
 * - Gom nhóm tất cả logic liên quan đến vòng đời của một đơn hàng (từ lúc tạo đến lúc giao thành công).
 * =====================================================================
 */
import { CouponsModule } from '../coupons/coupons.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProductsModule } from '../products/products/products.module';
import { ShippingModule } from '../shipping/shipping.module';
import { InvoiceService } from './invoice.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    PrismaModule,
    PaymentModule,
    NotificationsModule,
    CouponsModule,
    ShippingModule,
    ProductsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, InvoiceService],
  exports: [InvoiceService],
})
export class OrdersModule {}
