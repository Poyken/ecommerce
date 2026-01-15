import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { PrismaModule } from '@/core/prisma/prisma.module';
import { CommissionService } from './commission.service';

@Module({
  imports: [PrismaModule],
  providers: [AnalyticsService, CommissionService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService, CommissionService],
})
export class AnalyticsModule {}
