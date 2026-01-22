/**
 * =====================================================================
 * PLANS MODULE - Quản lý Gói dịch vụ
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. EXPORTS:
 * - Module này export `PlansService` để các module khác (VD: `SubscriptionModule`)
 *   có thể gọi hàm lấy thông tin gói cước (giá, giới hạn features) để xử lý đăng ký. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

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
