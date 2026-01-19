import { Module } from '@nestjs/common';
import { OrdersModule } from '@/orders/orders.module';
import { CartModule } from '@/cart/cart.module';
import { PaymentModule } from '@/payment/payment.module';
import { InvoicesModule } from '@/invoices/invoices.module';
import { ShippingModule } from '@/shipping/shipping.module';

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
