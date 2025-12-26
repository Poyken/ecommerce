import { Module } from '@nestjs/common';
import { PrismaModule } from '@core/prisma/prisma.module';

/**
 * =====================================================================
 * ROLES MODULE - Module quản lý phân quyền (RBAC)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. RBAC FOUNDATION:
 * - Đây là module nền tảng cho hệ thống bảo mật của ứng dụng.
 * - Nó quản lý các thực thể: Role (Vai trò), Permission (Quyền hạn) và mối liên kết giữa chúng.
 *
 * 2. DEPENDENCIES:
 * - `PrismaModule`: Cần thiết để tương tác với các bảng liên quan đến phân quyền trong database.
 *
 * 3. GLOBAL IMPACT:
 * - Mặc dù là một module riêng biệt, nhưng dữ liệu từ module này được sử dụng bởi `PermissionsGuard` trên toàn bộ ứng dụng để kiểm soát truy cập.
 * =====================================================================
 */
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  imports: [PrismaModule],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
