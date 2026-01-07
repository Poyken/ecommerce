/**
 * =====================================================================
 * METRICS MODULE - CẤU HÌNH HỆ THỐNG GIÁM SÁT
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Module này khởi tạo và cung cấp MetricsService cho toàn bộ ứng dụng.
 * Sử dụng @Global() để các module khác có thể dùng Prometheus metrics
 * mà không cần import lại nhiều lần.
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
