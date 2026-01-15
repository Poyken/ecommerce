/**
 * =====================================================================
 * METRICS MODULE - CẤU HÌNH HỆ THỐNG GIÁM SÁT
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Module này khởi tạo và cung cấp MetricsService cho toàn bộ ứng dụng.
 * Sử dụng @Global() để các module khác có thể dùng Prometheus metrics
 * mà không cần import lại nhiều lần. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Health Visibility: Cung cấp số liệu thời gian thực (CPU, RAM, RPS) cho Grafana Dashboard để đội vận hành (SRE) giám sát.
 * - Business Insight: Theo dõi số lượng đơn hàng, người dùng mới đăng ký để đội Business nắm bắt tình hình kinh doanh.

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
