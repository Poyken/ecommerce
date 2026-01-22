import { Module, forwardRef } from '@nestjs/common';
import { PaymentModule } from '@/sales/payment/payment.module';
import { PrismaModule } from '@core/prisma/prisma.module';

/**
 * =====================================================================
 * ORDERS MODULE - Module quản lý đơn hàng
 * =====================================================================
 *
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
