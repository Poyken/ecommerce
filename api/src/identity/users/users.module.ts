import { Module } from '@nestjs/common';
import { PrismaModule } from '@core/prisma/prisma.module';

/**
 * =====================================================================
 * USERS MODULE - Module quản lý người dùng
 * =====================================================================
 *
 * =====================================================================
 */
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

import { TenantsModule } from '@/identity/tenants/tenants.module';

import { UsersExportService } from './users-export.service';
import { UsersImportService } from './users-import.service';

import { UsersRepository } from './users.repository';

@Module({
  imports: [PrismaModule, TenantsModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersExportService,
    UsersImportService,
    UsersRepository,
  ],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
