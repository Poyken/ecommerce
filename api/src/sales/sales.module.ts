import { Module } from '@nestjs/common';
import { OrdersModule } from './orders/orders.module';
import { CartModule } from './cart/cart.module';
import { PaymentModule } from './payment/payment.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ShippingModule } from './shipping/shipping.module';
import { ReviewsModule } from './reviews/reviews.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { TaxModule } from './tax/tax.module';

/**
 * =====================================================================
 * SALES MODULE - Quản lý Bán hàng & Thanh toán
 * =====================================================================
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
    ReviewsModule,
    WishlistModule,
    TaxModule,
  ],
  exports: [
    OrdersModule,
    CartModule,
    PaymentModule,
    InvoicesModule,
    ShippingModule,
    ReviewsModule,
    WishlistModule,
    TaxModule,
  ],
})
export class SalesModule {}
