/**
 * =====================================================================
 * INSIGHTS.MODULE MODULE
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Module này đóng gói các thành phần liên quan lại với nhau.
 *
 * 1. CẤU TRÚC MODULE:
 *    - imports: Các module khác cần sử dụng
 *    - controllers: Các controller xử lý request
 *    - providers: Các service cung cấp logic
 *    - exports: Các service cho module khác sử dụng
 * =====================================================================
 */

import { Module } from '@nestjs/common';
import { InsightsService } from './insights.service';
import { InsightsController } from './insights.controller';
import { AiChatModule } from '@/ai-chat/ai-chat.module';
import { ScheduleModule } from '@nestjs/schedule';

/**
 * =============================================================================
 * INSIGHTS MODULE - PHÂN TÍCH KINH DOANH AI
 * =============================================================================
 *
 * Module này cung cấp:
 * 1. Tự động phân tích dữ liệu kinh doanh hàng ngày (Cronjob)
 * 2. AI Insights hiển thị trên Dashboard
 * 3. Gợi ý hành động cụ thể cho Admin
 *
 * =============================================================================
 */
@Module({
  imports: [AiChatModule, ScheduleModule],
  controllers: [InsightsController],
  providers: [InsightsService],
  exports: [InsightsService],
})
export class InsightsModule {}
