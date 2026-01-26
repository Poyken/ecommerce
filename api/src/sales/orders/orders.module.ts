import { Module, forwardRef } from '@nestjs/common';
import { PaymentModule } from '@/sales/payment/payment.module';
import { PrismaModule } from '@core/prisma/prisma.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { ProductsModule } from '@/catalog/products/products.module';
import { SkusModule } from '@/catalog/skus/skus.module';
import { ShippingModule } from '@/sales/shipping/shipping.module';
import { LoyaltyModule } from '@/marketing/loyalty/loyalty.module';
import { PromotionsModule } from '@/marketing/promotions/promotions.module';
import { CartModule } from '@/sales/cart/cart.module';
import { InventoryModule } from '@/operations/inventory/inventory.module';
import { BullModule } from '@nestjs/bullmq';

import { OrdersController } from './orders.controller';
import { InvoiceService } from './invoice.service';
import { OrdersProcessor } from './orders.processor';
import { OrdersExportService } from './orders-export.service';

// Clean Architecture
import { ORDER_REPOSITORY } from '@/sales/domain/repositories/order.repository.interface';
import { PrismaOrderRepository } from '@/sales/infrastructure/repositories/prisma-order.repository';
import * as UseCases from './application/use-cases';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => PaymentModule),
    NotificationsModule,
    PromotionsModule,
    forwardRef(() => ShippingModule),
    ProductsModule,
    SkusModule,
    CartModule,
    InventoryModule,
    LoyaltyModule,
    BullModule.registerQueue({
      name: 'orders-queue',
    }),
  ],
  controllers: [OrdersController],
  providers: [
    InvoiceService,
    OrdersProcessor,
    OrdersExportService,
    {
      provide: ORDER_REPOSITORY,
      useClass: PrismaOrderRepository,
    },
    ...Object.values(UseCases),
  ],
  exports: [InvoiceService, ORDER_REPOSITORY, ...Object.values(UseCases)],
})
export class OrdersModule {}
