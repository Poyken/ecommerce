import { PrismaModule } from '@core/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { BulkController } from './bulk.controller';
import { BulkService } from './bulk.service';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';

@Module({
  imports: [PrismaModule],
  controllers: [BulkController, SecurityController],
  providers: [BulkService, SecurityService],
  exports: [BulkService, SecurityService],
})
/**
 * =====================================================================
 * ADMIN MODULE
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MODULE DECORATOR (`@Module`):
 * - Đây là nơi khai báo "Dependency Graph" cho tính năng Admin.
 * - `imports`: Admin cần dùng `PrismaModule` để query database.
 * - `controllers`: Đăng ký `BulkController` để nhận HTTP requests.
 * - `providers`: Đăng ký `BulkService` để xử lý logic business.
 *
 * 2. EXPORTS:
 * - `exports: [BulkService]` có nghĩa là nếu module khác import `AdminModule`,
 *   họ sẽ dùng được `BulkService` (dependency injection) mà không bị lỗi. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */
export class AdminModule {}
