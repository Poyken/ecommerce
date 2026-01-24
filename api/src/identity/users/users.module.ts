import { Module, forwardRef } from '@nestjs/common';
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
