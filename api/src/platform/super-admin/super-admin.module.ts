/**
 * =====================================================================
 * SUPER ADMIN MODULE
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PHẠM VI:
 * - Module này chỉ dành riêng cho SuperAdmin (Chủ sở hữu hệ thống SaaS).
 * - Không liên quan đến Admin của từng cửa hàng (Tenant Admin).
 *
 * 2. DEPENDENCIES:
 * - Import `AuthModule` để tái sử dụng `TokenService` và `PermissionService`
 *   cho tính năng Impersonate (Đăng nhập thay). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */
import { Module } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminController } from './super-admin.controller';
import { AuthModule } from '@/identity/auth/auth.module';
import { PlatformAnalyticsController } from '@/platform/platform-analytics.controller';

@Module({
  imports: [AuthModule],
  controllers: [SuperAdminController, PlatformAnalyticsController],
  providers: [SuperAdminService],
})
export class SuperAdminModule {}

