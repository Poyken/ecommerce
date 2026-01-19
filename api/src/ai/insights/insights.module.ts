/**
 * =====================================================================
 * AI INSIGHTS MODULE - TRUNG TÂM PHÂN TÍCH DL CỬA HÀNG
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MODULE DEPENDENCY (Sự phụ thuộc):
 * - Module này cần `PrismaModule` để đọc dữ liệu từ DB và `CacheModule` (thường được import global) để caching.
 *
 * 2. ENCAPSULATION (Tính đóng gói):
 * - Đóng gói logic phân tích thành một Feature Module riêng biệt, giúp codebase ngăn nắp.
 *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Cấu trúc module rõ ràng giúp dễ dàng mở rộng thêm các loại phân tích khác (VD: AI dự báo doanh thu tháng tới) mà không làm loãng logic Catalog hay Sales.
 * =====================================================================
 */

import { Module } from '@nestjs/common';
import { InsightsService } from './insights.service';
import { InsightsController } from './insights.controller';
import { PrismaModule } from '@core/prisma/prisma.module';
// import { AuthModule } from '@/auth/auth.module'; // If needed for guards

@Module({
  imports: [PrismaModule],
  controllers: [InsightsController],
  providers: [InsightsService],
  exports: [InsightsService],
})
export class InsightsModule {}
