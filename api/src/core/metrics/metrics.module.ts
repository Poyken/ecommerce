/**
 * =====================================================================
 * METRICS MODULE - CẤU HÌNH HỆ THỐNG GIÁM SÁT
 * =====================================================================
 *
 * =====================================================================
 */

import { Module, Global } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { PrismaModule } from '@core/prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
