import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { AiChatModule } from '@/ai-chat/ai-chat.module';
import { ProductsModule } from '@/products/products.module';

/**
 * =============================================================================
 * AGENT MODULE - HỆ THỐNG AGENT TỰ HÀNH
 * =============================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Đây là module triển khai kiến trúc "AI Agent" - nơi AI không chỉ trả lời
 * câu hỏi mà còn thực hiện các hành động thực tế trên hệ thống.
 *
 * Luồng hoạt động:
 * 1. Admin gửi lệnh bằng ngôn ngữ tự nhiên (VD: "Giảm giá 20% cho áo phông")
 * 2. AgentService phân tích lệnh bằng AI → Tạo ra TaskPlan
 * 3. Thực thi từng Task theo thứ tự
 * 4. Trả kết quả về cho Admin
 *
 * =============================================================================
 */
@Module({
  imports: [AiChatModule, ProductsModule],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
