import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { PrismaModule } from '@/core/prisma/prisma.module';
import { ShippingModule } from '@/sales/shipping/shipping.module';
import { OrdersModule } from '@/sales/orders/orders.module';

@Module({
  imports: [PrismaModule, ShippingModule, OrdersModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
