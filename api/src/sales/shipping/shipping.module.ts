import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { GHNService } from './ghn.service';
import { ShippingController } from './shipping.controller';
import { ShippingCronService } from './shipping.cron.service';
import { ShippingService } from './shipping.service';

import { NotificationsModule } from '@/notifications/notifications.module';
import { EmailModule } from '@/platform/integrations/external/email/email.module';

@Module({
  imports: [HttpModule, NotificationsModule, EmailModule],
  controllers: [ShippingController],
  providers: [ShippingService, GHNService, ShippingCronService],
  exports: [ShippingService, GHNService],
})
/**
 * =====================================================================
 * SHIPPING MODULE
 * =====================================================================
 *
 * =====================================================================
 */
export class ShippingModule {}
