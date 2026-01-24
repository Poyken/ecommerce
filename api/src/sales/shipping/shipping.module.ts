import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { GHNService } from './ghn.service';
import { ShippingController } from './shipping.controller';
import { ShippingCronService } from './shipping.cron.service';
import { ShippingService } from './shipping.service';

import { NotificationsModule } from '@/notifications/notifications.module';
import { EmailModule } from '@/platform/integrations/external/email/email.module';

import { PrismaModule } from '@core/prisma/prisma.module';
import { SHIPMENT_REPOSITORY } from '../domain/repositories/shipment.repository.interface';
import { PrismaShipmentRepository } from '../infrastructure/repositories/prisma-shipment.repository';
import { UpdateShipmentStatusUseCase } from '../application/use-cases/shipments/update-shipment-status.use-case';

@Module({
  imports: [HttpModule, NotificationsModule, EmailModule, PrismaModule],
  controllers: [ShippingController],
  providers: [
    ShippingService,
    GHNService,
    ShippingCronService,
    {
      provide: SHIPMENT_REPOSITORY,
      useClass: PrismaShipmentRepository,
    },
    UpdateShipmentStatusUseCase,
  ],
  exports: [ShippingService, GHNService, UpdateShipmentStatusUseCase],
})
/**
 * =====================================================================
 * SHIPPING MODULE
 * =====================================================================
 *
 * =====================================================================
 */
export class ShippingModule {}
