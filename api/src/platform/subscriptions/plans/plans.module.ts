/**
 * =====================================================================
 * PLANS MODULE - Quản lý Gói dịch vụ
 * =====================================================================
 *
 * =====================================================================
 */
import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { PrismaModule } from '@core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}
