import { HttpModule } from '@nestjs/axios';
import { Module, forwardRef } from '@nestjs/common';
import { GHNService } from './ghn.service';
import { ShippingController } from './shipping.controller';
import { ShippingCronService } from './shipping.cron.service';
import { ShippingService } from './shipping.service';

import { NotificationsModule } from '@/notifications/notifications.module';
import { EmailModule } from '@/platform/integrations/external/email/email.module';

import { PrismaModule } from '@core/prisma/prisma.module';
import { SHIPMENT_REPOSITORY } from '../domain/repositories/shipment.repository.interface';
import { PrismaShipmentRepository } from '../infrastructure/repositories/prisma-shipment.repository';
import * as UseCases from './application/use-cases';

import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    HttpModule,
    NotificationsModule,
    EmailModule,
    PrismaModule,
    forwardRef(() => OrdersModule),
  ],
  controllers: [ShippingController],
  providers: [
    ShippingService,
    GHNService,
    ShippingCronService,
    {
      provide: SHIPMENT_REPOSITORY,
      useClass: PrismaShipmentRepository,
    },
    UseCases.UpdateShipmentStatusUseCase,
    UseCases.GetShippingLocationUseCase,
    UseCases.CalculateShippingFeeUseCase,
  ],
  exports: [
    ShippingService,
    GHNService,
    SHIPMENT_REPOSITORY,
    UseCases.UpdateShipmentStatusUseCase,
    UseCases.GetShippingLocationUseCase,
    UseCases.CalculateShippingFeeUseCase,
  ],
})
/**
 * =====================================================================
 * SHIPPING MODULE
 * =====================================================================
 *
 * =====================================================================
 */
export class ShippingModule {}
