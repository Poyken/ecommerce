/**
 * MINIMAL SEED - Chỉ tạo dữ liệu cần thiết cho Auth
 * - Permissions
 * - Roles (Super Admin, Admin, User)
 * - Tenant mặc định
 * - Users (super@platform.com, admin@test.com, user@test.com)
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Danh sách Permissions cơ bản (chỉ dùng trường `name` vì schema chỉ có `name`)
const PERMISSIONS = [
  'user:read',
  'user:create',
  'user:update',
  'user:delete',
  'role:read',
  'role:create',
  'role:update',
  'role:delete',
  'product:read',
  'product:create',
  'product:update',
  'product:delete',
  'order:read',
  'order:create',
  'order:update',
  'order:delete',
  'analytics:read',
  'settings:read',
  'settings:update',
];

async function main() {
  console.log('🌱 MINIMAL SEED - Starting...\n');

  // 1. Clean Database
  console.log('🧹 Cleaning database...');
  await prisma.$executeRaw`TRUNCATE TABLE "UserRole", "RolePermission", "UserPermission", "User", "Role", "Permission", "Tenant" CASCADE`;
  console.log('✅ Database cleaned.\n');

  // 2. Create Permissions
  console.log('🛡️ Creating Permissions...');
  await prisma.permission.createMany({
    data: PERMISSIONS.map((name) => ({ name })),
    skipDuplicates: true,
  });
  const allPermissions = await prisma.permission.findMany();
  console.log(`✅ Created ${allPermissions.length} permissions.\n`);

  // 3. Create Tenants
  console.log('🏢 Creating Tenants...');
  const tenant = await prisma.tenant.create({
    data: {
      id: 'default-tenant',
      name: 'Default Tenant',
      domain: 'localhost',
      plan: 'ENTERPRISE',
      themeConfig: { primaryColor: '#000000' },
    },
  });

  const vercelTenant = await prisma.tenant.create({
    data: {
      id: 'vercel-tenant',
      name: 'Vercel Production',
      domain: 'web-five-gilt-79.vercel.app',
      plan: 'ENTERPRISE',
      themeConfig: { primaryColor: '#000000' },
    },
  });
  console.log(`✅ Created tenants: ${tenant.domain}, ${vercelTenant.domain}\n`);

  // 4. Create Roles
  console.log('👔 Creating Roles...');

  // Super Admin Role (Global - all permissions)
  const superAdminRole = await prisma.role.create({
    data: {
      name: 'Super Admin',
      tenantId: null, // Global
      permissions: {
        create: allPermissions.map((p) => ({ permissionId: p.id })),
      },
    },
  });

  // Admin Role (Tenant-specific - most permissions)
  const adminRole = await prisma.role.create({
    data: {
      name: 'Admin',
      tenantId: tenant.id,
      permissions: {
        create: allPermissions
          .filter((p) => !p.name.startsWith('role:'))
          .map((p) => ({ permissionId: p.id })),
      },
    },
  });

  // User Role (Basic read permissions)
  const userRole = await prisma.role.create({
    data: {
      name: 'User',
      tenantId: tenant.id,
      permissions: {
        create: allPermissions
          .filter((p) => p.name.endsWith(':read'))
          .map((p) => ({ permissionId: p.id })),
      },
    },
  });
  console.log(`✅ Created roles: Super Admin, Admin, User\n`);

  // 5. Create Users
  console.log('👤 Creating Users...');
  const passwordHash = await bcrypt.hash('123456', 10);

  // Super Admin (Global - no tenantId)
  const superAdmin = await prisma.user.create({
    data: {
      email: 'super@platform.com',
      firstName: 'Super',
      lastName: 'Admin',
      password: passwordHash,
      tenantId: null, // Global user - can access any tenant
      roles: { create: { roleId: superAdminRole.id } },
    },
  });
  console.log(`   ✅ Super Admin: ${superAdmin.email} (password: 123456)`);

  // Tenant Admin (belongs to default-tenant)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      firstName: 'Tenant',
      lastName: 'Admin',
      password: passwordHash,
      tenantId: tenant.id,
      roles: { create: { roleId: adminRole.id } },
    },
  });
  console.log(`   ✅ Admin: ${admin.email} (password: 123456)`);

  // Regular User (belongs to default-tenant)
  const user = await prisma.user.create({
    data: {
      email: 'user@test.com',
      firstName: 'Test',
      lastName: 'User',
      password: passwordHash,
      tenantId: tenant.id,
      roles: { create: { roleId: userRole.id } },
    },
  });
  console.log(`   ✅ User: ${user.email} (password: 123456)`);

  console.log('\n🎉 MINIMAL SEED COMPLETED!\n');
  console.log('📋 Summary:');
  console.log(`   - Permissions: ${allPermissions.length}`);
  console.log(`   - Roles: 3 (Super Admin, Admin, User)`);
  console.log(`   - Users: 3`);
  console.log(`   - Tenants: 2 (localhost, vercel)`);
  console.log('\n🔑 Login Credentials:');
  console.log('   Super Admin: super@platform.com / 123456');
  console.log('   Admin: admin@test.com / 123456');
  console.log('   User: user@test.com / 123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
