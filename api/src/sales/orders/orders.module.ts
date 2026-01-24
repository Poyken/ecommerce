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
import { InventoryModule } from '@/inventory/inventory.module';
import { BullModule } from '@nestjs/bullmq';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { InvoiceService } from './invoice.service';
import { OrdersProcessor } from './orders.processor';
import { OrdersExportService } from './orders-export.service';
import { OrdersRepository } from './orders.repository';

// Clean Architecture
import { ORDER_REPOSITORY } from './domain/repositories/order.repository.interface';
import { PrismaOrderRepository } from './infrastructure/repositories/prisma-order.repository';
import * as UseCases from './application/use-cases';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => PaymentModule),
    NotificationsModule,
    PromotionsModule,
    ShippingModule,
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
    OrdersService,
    OrdersRepository,
    InvoiceService,
    OrdersProcessor,
    OrdersExportService,
    {
      provide: ORDER_REPOSITORY,
      useClass: PrismaOrderRepository,
    },
    ...Object.values(UseCases),
  ],
  exports: [
    OrdersService,
    OrdersRepository,
    InvoiceService,
    ORDER_REPOSITORY,
    ...Object.values(UseCases),
  ],
})
export class OrdersModule {}
