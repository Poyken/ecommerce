import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { PrismaModule } from '@/core/prisma/prisma.module';
import { CommissionService } from './commission.service';

import { PaymentEventsHandler } from './application/handlers/payment-events.handler';

@Module({
  imports: [PrismaModule],
  providers: [AnalyticsService, CommissionService, PaymentEventsHandler],
  controllers: [AnalyticsController],
  exports: [AnalyticsService, CommissionService],
})
export class AnalyticsModule {}
