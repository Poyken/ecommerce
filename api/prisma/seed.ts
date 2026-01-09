/**
 * SEED - Tạo dữ liệu thiết yếu (idempotent - an toàn chạy nhiều lần)
 *
 * Tự động tạo nếu chưa tồn tại:
 * - Tất cả Permissions từ source code
 * - Roles (Super Admin, Admin, User)
 * - Tenants (localhost, vercel)
 * - Users (super@platform.com, admin@test.com, user@test.com)
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Tất cả Permissions từ source code (grep -rohE "@Permissions\('[^']+'\)" src/)
const ALL_PERMISSIONS = [
  // Admin
  'admin:read',
  'admin:update',
  // Analytics
  'analytics:read',
  // Audit Log
  'auditLog:read',
  // Blog
  'blog:update',
  // Brand
  'brand:create',
  'brand:delete',
  'brand:update',
  // Category
  'category:create',
  'category:delete',
  'category:update',
  // Coupon
  'coupon:create',
  'coupon:delete',
  'coupon:read',
  'coupon:update',
  // Notification
  'notification:create',
  'notification:delete',
  'notification:read',
  // Order
  'order:read',
  'order:update',
  // Page
  'page:create',
  'page:delete',
  'page:read',
  'page:update',
  // Permission
  'permission:create',
  'permission:delete',
  'permission:update',
  // Product
  'product:create',
  'product:delete',
  'product:read',
  'product:update',
  // Review
  'review:delete',
  'review:read',
  'review:update',
  // Role
  'role:create',
  'role:delete',
  'role:read',
  'role:update',
  // SKU
  'sku:read',
  'sku:update',
  // Super Admin
  'superAdmin:read',
  'superAdmin:write',
  // Tenant
  'tenant:create',
  'tenant:delete',
  'tenant:read',
  'tenant:update',
  // User
  'user:create',
  'user:delete',
  'user:read',
  'user:update',
];

async function main() {
  console.log('🌱 SEED - Ensuring essential data exists...\n');

  // 1. Upsert Permissions
  console.log('🛡️ Syncing Permissions...');
  for (const name of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
  const allPermissions = await prisma.permission.findMany();
  console.log(`   ✅ ${allPermissions.length} permissions ready.\n`);

  // 2. Upsert Tenants
  console.log('🏢 Syncing Tenants...');
  const localhostTenant = await prisma.tenant.upsert({
    where: { domain: 'localhost' },
    create: {
      name: 'Local Development',
      domain: 'localhost',
      plan: 'ENTERPRISE',
      themeConfig: { primaryColor: '#000000' },
    },
    update: {},
  });

  const vercelTenant = await prisma.tenant.upsert({
    where: { domain: 'web-five-gilt-79.vercel.app' },
    create: {
      name: 'Vercel Production',
      domain: 'web-five-gilt-79.vercel.app',
      plan: 'ENTERPRISE',
      themeConfig: { primaryColor: '#000000' },
    },
    update: {},
  });
  console.log(
    `   ✅ Tenants: ${localhostTenant.domain}, ${vercelTenant.domain}\n`,
  );

  // 3. Upsert SUPER_ADMIN Role (Global)
  console.log('👔 Syncing Roles...');
  let superAdminRole = await prisma.role.findFirst({
    where: { name: 'SUPER_ADMIN', tenantId: null },
  });

  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: {
        name: 'SUPER_ADMIN',
        tenantId: null,
        permissions: {
          create: allPermissions.map((p) => ({ permissionId: p.id })),
        },
      },
    });
    console.log('   ✅ SUPER_ADMIN Role created.');
  } else {
    console.log('   ✅ SUPER_ADMIN Role exists.');
  }

  // ADMIN Role (Tenant-specific)
  let adminRole = await prisma.role.findFirst({
    where: { name: 'ADMIN', tenantId: localhostTenant.id },
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        name: 'ADMIN',
        tenantId: localhostTenant.id,
        permissions: {
          create: allPermissions
            .filter((p) => !p.name.startsWith('SUPER_ADMIN:'))
            .map((p) => ({ permissionId: p.id })),
        },
      },
    });
    console.log('   ✅ ADMIN Role created.');
  } else {
    console.log('   ✅ ADMIN Role exists.');
  }

  // USER Role (Tenant-specific, read-only)
  let userRole = await prisma.role.findFirst({
    where: { name: 'USER', tenantId: localhostTenant.id },
  });

  if (!userRole) {
    userRole = await prisma.role.create({
      data: {
        name: 'USER',
        tenantId: localhostTenant.id,
        permissions: {
          create: allPermissions
            .filter((p) => p.name.endsWith(':read'))
            .map((p) => ({ permissionId: p.id })),
        },
      },
    });
    console.log('   ✅ USER Role created.');
  } else {
    console.log('   ✅ USER Role exists.');
  }
  console.log('');

  // 4. Upsert Users
  console.log('👤 Syncing Users...');
  const passwordHash = await bcrypt.hash('123456', 10);

  // Super Admin (Global)
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { email: 'super@platform.com' },
  });

  if (!existingSuperAdmin) {
    await prisma.user.create({
      data: {
        email: 'super@platform.com',
        firstName: 'Super',
        lastName: 'Admin',
        password: passwordHash,
        tenantId: localhostTenant.id,
        roles: { create: { roleId: superAdminRole.id } },
      },
    });
    console.log('   ✅ Super Admin created: super@platform.com');
  } else {
    console.log('   ✅ Super Admin exists: super@platform.com');
  }

  // Tenant Admin
  const existingAdmin = await prisma.user.findFirst({
    where: { email: 'admin@test.com', tenantId: localhostTenant.id },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: 'admin@test.com',
        firstName: 'Tenant',
        lastName: 'Admin',
        password: passwordHash,
        tenantId: localhostTenant.id,
        roles: { create: { roleId: adminRole.id } },
      },
    });
    console.log('   ✅ Admin created: admin@test.com');
  } else {
    console.log('   ✅ Admin exists: admin@test.com');
  }

  // Regular User
  const existingUser = await prisma.user.findFirst({
    where: { email: 'user@test.com', tenantId: localhostTenant.id },
  });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        email: 'user@test.com',
        firstName: 'Test',
        lastName: 'User',
        password: passwordHash,
        tenantId: localhostTenant.id,
        roles: { create: { roleId: userRole.id } },
      },
    });
    console.log('   ✅ User created: user@test.com');
  } else {
    console.log('   ✅ User exists: user@test.com');
  }

  console.log('\n🎉 SEED COMPLETED!\n');
  console.log('📋 Summary:');
  console.log(`   - Permissions: ${allPermissions.length}`);
  console.log('   - Roles: Super Admin, Admin, User');
  console.log('   - Tenants: localhost, vercel');
  console.log('   - Users: 3');
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
