import { PrismaModule } from '@core/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
/**
 * =====================================================================
 * ANALYTICS MODULE
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PRISMA MODULE:
 * - Module này cần kết nối Database để thực hiện các câu query thống kê phức tạp (GROUP BY, COUNT, SUM...).
 * - Vì vậy cần import `PrismaModule`.
 *
 * 2. RESPONSIBILITY:
 * - Chịu trách nhiệm cung cấp số liệu cho Dashboard Admin (Doanh thu, Đơn hàng mới...).
 * - Tách biệt hoàn toàn với logic xử lý đơn hàng hay sản phẩm.
 * =====================================================================
 */
export class AnalyticsModule {}
