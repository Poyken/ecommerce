import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '@core/prisma/prisma.module';

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
 * - Sử dụng `PrismaModule` để thực hiện các truy vấn CRUD trên bảng `User`. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

import { TenantsModule } from '@/identity/tenants/tenants.module';

import { UsersExportService } from './users-export.service';
import { UsersImportService } from './users-import.service';
import { UsersRepository } from './users.repository';

// Clean Architecture
import { USER_REPOSITORY } from '../domain/repositories/user.repository.interface';
import { PrismaUserRepository } from '../infrastructure/repositories/prisma-user.repository';

@Module({
  imports: [PrismaModule, forwardRef(() => TenantsModule)],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersExportService,
    UsersImportService,
    UsersRepository,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [UsersService, UsersRepository, USER_REPOSITORY],
})
export class UsersModule {}
