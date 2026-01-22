/**
 * =====================================================================
 * IDENTITY MODULE - Domain Module cho xác thực và người dùng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Đây là Domain Module gộp các module liên quan đến Identity:
 * - AuthModule: Xác thực (JWT, OAuth, 2FA)
 * - UsersModule: Quản lý người dùng
 * - RolesModule: Quản lý vai trò và quyền hạn (RBAC)
 * - TenantsModule: Quản lý Multi-tenancy
 *
 * 🎯 LỢI ÍCH:
 * - Giảm số lượng imports trong AppModule
 * - Dễ dàng quản lý dependency giữa các module liên quan
 * - Code organization tốt hơn theo Domain-Driven Design
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
  imports: [AuthModule, UsersModule, RolesModule, TenantsModule, AddressesModule],
  exports: [AuthModule, UsersModule, RolesModule, TenantsModule, AddressesModule],
})
export class IdentityModule {}
