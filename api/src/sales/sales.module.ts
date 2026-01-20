import { Module } from '@nestjs/common';
import { OrdersModule } from './orders/orders.module';
import { CartModule } from './cart/cart.module';
import { PaymentModule } from './payment/payment.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ShippingModule } from './shipping/shipping.module';

/**
 * =====================================================================
 * SALES MODULE - Quản lý Bán hàng & Thanh toán
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TRANSACTIONAL DOMAIN:
 * - Module này quản lý toàn bộ vòng đời của một giao dịch, từ khi khách hàng thêm đồ vào giỏ (`Cart`)
 *   đến khi tạo đơn (`Orders`), thanh toán (`Payment`) và xuất hóa đơn (`Invoices`).
 *
 * 2. INTEGRATION:
 * - Tập hợp các service quan trọng liên quan đến dòng tiền và logistics.
 *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý quy trình Checkout, theo dõi tình trạng thanh toán và điều phối giao hàng.
 *
 * =====================================================================
 */

@Module({
  imports: [
    OrdersModule,
    CartModule,
    PaymentModule,
    InvoicesModule,
    ShippingModule,
  ],
  exports: [
    OrdersModule,
    CartModule,
    PaymentModule,
    InvoicesModule,
    ShippingModule,
  ],
})
export class SalesModule {}
