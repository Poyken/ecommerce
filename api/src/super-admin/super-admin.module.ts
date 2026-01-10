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
 *   cho tính năng Impersonate (Đăng nhập thay).
 * =====================================================================
 */
import { Module } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminController } from './super-admin.controller';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SuperAdminController],
  providers: [SuperAdminService],
})
export class SuperAdminModule {}
