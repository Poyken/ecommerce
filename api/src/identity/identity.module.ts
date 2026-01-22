/**
 * =====================================================================
 * IDENTITY MODULE - Domain Module cho xác thực và người dùng
 * =====================================================================
 *
 * =====================================================================
 */

import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { TenantsModule } from './tenants/tenants.module';
import { AddressesModule } from './addresses/addresses.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    RolesModule,
    TenantsModule,
    AddressesModule,
  ],
  exports: [
    AuthModule,
    UsersModule,
    RolesModule,
    TenantsModule,
    AddressesModule,
  ],
})
export class IdentityModule {}
