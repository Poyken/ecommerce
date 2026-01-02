import { Module } from '@nestjs/common';
import { FeatureFlagsPublicController } from './feature-flags-public.controller';
import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagsService } from './feature-flags.service';

@Module({
  controllers: [FeatureFlagsPublicController, FeatureFlagsController],
  providers: [FeatureFlagsService],
  exports: [FeatureFlagsService],
})
/**
 * =====================================================================
 * FEATURE FLAGS MODULE
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DUAL CONTROLLER STRATEGY:
 * - `FeatureFlagsController`: Dành cho Admin (Tạo, Sửa, Xóa cờ). Cần Auth Guard.
 * - `FeatureFlagsPublicController`: Dành cho Client App (Check xem tính năng bật hay tắt). Không cần Auth (hoặc Auth lỏng).
 * - -> Tách biệt rõ ràng quyền hạn ngay từ lớp Controller.
 * =====================================================================
 */
export class FeatureFlagsModule {}
