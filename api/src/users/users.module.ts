import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';

/**
 * =====================================================================
 * USERS MODULE - Module quản lý người dùng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. USER MANAGEMENT:
 * - Module này chịu trách nhiệm quản lý thông tin hồ sơ người dùng, phân quyền (Roles) và các thao tác quản trị.
 *
 * 2. EXPORTS:
 * - `UsersService` được export để các module khác (như Auth hoặc Order) có thể sử dụng để tìm kiếm hoặc kiểm tra thông tin người dùng.
 *
 * 3. PRISMA INTEGRATION:
 * - Sử dụng `PrismaModule` để thực hiện các truy vấn CRUD trên bảng `User`.
 * =====================================================================
 */
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
