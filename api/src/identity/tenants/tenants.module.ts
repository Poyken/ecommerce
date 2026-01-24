/**
 * =====================================================================
 * TENANTS.MODULE MODULE
 * =====================================================================
 *
 * =====================================================================
 */

import { Module, forwardRef } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { PlanUsageService } from './plan-usage.service';
import { SubscriptionsService } from './subscriptions.service';

import { SubscriptionsController } from './subscriptions.controller';
import { TenantSettingsController } from './tenant-settings.controller';
import { TenantRegistrationController } from './tenant-registration.controller';
import { UsersModule } from '../users/users.module';

// Clean Architecture
import { TENANT_REPOSITORY } from '../domain/repositories/tenant.repository.interface';
import { PrismaTenantRepository } from '../infrastructure/repositories/prisma-tenant.repository';
import { PASSWORD_HASHER } from '../domain/services/password-hasher.interface';
import { BcryptPasswordHasher } from '../infrastructure/services/bcrypt-password-hasher.service';
import * as UseCases from '../application/use-cases/tenants';
import { PrismaService } from '@core/prisma/prisma.service';

@Module({
  imports: [forwardRef(() => UsersModule)],
  controllers: [
    TenantsController,
    SubscriptionsController,
    TenantSettingsController,
    TenantRegistrationController,
  ],
  providers: [
    TenantsService,
    PlanUsageService,
    SubscriptionsService,
    {
      provide: TENANT_REPOSITORY,
      useClass: PrismaTenantRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasher,
    },
    ...Object.values(UseCases),
  ],
  exports: [
    TenantsService,
    PlanUsageService,
    SubscriptionsService,
    TENANT_REPOSITORY,
    ...Object.values(UseCases),
  ],
})
export class TenantsModule {}
