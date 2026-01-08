import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🔴 STARTING DATABASE PURGE (KEEPING SUPERADMIN ONLY)...');

  const tableNames = [
    'AiChatMessage',
    'AiChatSession',
    'PerformanceMetric',
    'ChatMessage',
    'ChatConversation',
    'NewsletterSubscriber',
    'OutboxEvent',
    'InventoryLog',
    'Review',
    'Translation',
    'ProductTranslation',
    'CartItem',
    'Cart',
    'OrderItem',
    'Order',
    'Wishlist',
    'BlogProduct',
    'Blog',
    'FeatureFlag',
    'OptionValue',
    'ProductOption',
    'SkuImage',
    'ProductImage',
    'Sku',
    'Product',
    'Brand',
    'Category',
    'Page',
    'Tenant',
    'Address',
    'UserRole',
    'RolePermission',
    'UserPermission',
    'User',
    'Role',
    'Permission',
  ];

  console.log('🧹 Truncating all tables...');

  // Disable constraints for cleaner truncation in PostgreSQL
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "' + tableNames.join('", "') + '" CASCADE;',
  );

  console.log('✅ Database purged.');

  // ===================================
  // 1. SEED PERMISSIONS
  // ===================================
  console.log('🛡️ Seeding Permissions...');
  const PERMISSIONS_LIST = [
    'tenant:read',
    'tenant:create',
    'tenant:update',
    'tenant:delete',
    'tenant:switch',
    'user:read',
    'user:create',
    'user:update',
    'user:delete',
    'product:read',
    'product:create',
    'product:update',
    'product:delete',
    'category:read',
    'category:create',
    'category:update',
    'category:delete',
    'brand:read',
    'brand:create',
    'brand:update',
    'brand:delete',
    'sku:read',
    'sku:create',
    'sku:update',
    'sku:delete',
    'order:read',
    'order:create',
    'order:update',
    'order:delete',
    'coupon:read',
    'coupon:create',
    'coupon:update',
    'coupon:delete',
    'blog:read',
    'blog:create',
    'blog:update',
    'blog:delete',
    'page:read',
    'page:create',
    'page:update',
    'page:delete',
    'review:read',
    'review:create',
    'review:update',
    'review:delete',
    'review:approve',
    'superAdmin:read',
    'superAdmin:update',
    'admin:read',
    'admin:update',
    'notification:read',
    'notification:create',
    'notification:delete',
    'notification:send',
    'chat:read',
    'chat:send',
    'chat:manage',
    'inventory:read',
    'inventory:update',
    'inventory:log',
    'role:read',
    'role:create',
    'role:update',
    'role:delete',
    'permission:read',
    'dashboard:view',
    'dashboard:analytics',
    'analytics:read',
    'feature_flag:read',
    'feature_flag:create',
    'feature_flag:update',
    'feature_flag:delete',
    'system:settings',
    'system:logs',
    'auditLog:read',
    'wishlist:read',
    'wishlist:create',
    'wishlist:delete',
  ];

  for (const name of PERMISSIONS_LIST) {
    await prisma.permission.create({ data: { name } });
  }
  const allPermissions = await prisma.permission.findMany();

  // ===================================
  // 2. SEED ROLES
  // ===================================
  console.log('🛡️ Seeding Roles...');

  const superAdminRole = await prisma.role.create({
    data: { name: 'SUPER_ADMIN' },
  });
  const adminRole = await prisma.role.create({ data: { name: 'ADMIN' } });
  const userRole = await prisma.role.create({ data: { name: 'USER' } });

  // Super Admin gets all permissions
  await prisma.rolePermission.createMany({
    data: allPermissions.map((p) => ({
      roleId: superAdminRole.id,
      permissionId: p.id,
    })),
  });

  // Basic Tenant Admin permissions (Common defaults)
  const tenantAdminPermissions = allPermissions.filter(
    (p) =>
      !p.name.startsWith('tenant:') &&
      !p.name.startsWith('superAdmin:') &&
      !p.name.startsWith('system:'),
  );
  await prisma.rolePermission.createMany({
    data: tenantAdminPermissions.map((p) => ({
      roleId: adminRole.id,
      permissionId: p.id,
    })),
  });

  // ===================================
  // 3. CREATE DEFAULT TENANT (Localhost)
  // ===================================
  const defaultTenant = await prisma.tenant.upsert({
    where: { domain: 'localhost' },
    update: {},
    create: {
      name: 'Default Store',
      domain: 'localhost',
      plan: 'ENTERPRISE',
      themeConfig: {
        primaryColor: '#000000',
        fontFamily: 'Inter',
        borderRadius: '8px',
      },
      id: 'default-tenant-id',
    },
  });
  console.log('✅ Default Tenant (localhost) ensured.');

  // ===================================
  // 4. CREATE SUPERADMIN USER
  // ===================================
  const hashPassword = await bcrypt.hash('123456', 10);

  // Super Admin (belongs to default tenant but has global permissions)
  const superAdminUser = await prisma.user.create({
    data: {
      email: 'super@platform.com',
      password: hashPassword,
      firstName: 'Super',
      lastName: 'Admin',
      tenantId: defaultTenant.id,
    },
  });

  await prisma.userRole.create({
    data: {
      userId: superAdminUser.id,
      roleId: superAdminRole.id,
    },
  });

  // Tenant Admin (normal admin for the default tenant)
  const tenantAdminUser = await prisma.user.create({
    data: {
      email: 'admin@localhost.com',
      password: hashPassword,
      firstName: 'Tenant',
      lastName: 'Admin',
      tenantId: defaultTenant.id,
    },
  });

  await prisma.userRole.create({
    data: {
      userId: tenantAdminUser.id,
      roleId: adminRole.id,
    },
  });

  // ===================================
  // 5. SEED CATALOG (Category, Brand, Product, SKU)
  // ===================================
  console.log('📦 Seeding Catalog...');

  const category = await prisma.category.create({
    data: {
      name: 'Furniture',
      slug: 'furniture',
      tenantId: defaultTenant.id,
    },
  });

  const brand = await prisma.brand.create({
    data: {
      name: 'TestBrand',
      tenantId: defaultTenant.id,
    },
  });

  const product = await prisma.product.create({
    data: {
      name: 'Test Ergonomic Chair',
      slug: 'test-ergonomic-chair',
      description: 'A comfortable chair for testing purposes.',
      categories: {
        create: {
          categoryId: category.id,
        },
      },
      brandId: brand.id,
      tenantId: defaultTenant.id,
    },
  });

  const sku = await prisma.sku.create({
    data: {
      skuCode: 'SKU-TEST-001',
      price: 199000,
      stock: 100,
      status: 'ACTIVE',
      productId: product.id,
      tenantId: defaultTenant.id,
    },
  });

  console.log(`✅ Created Product: ${product.name} (SKU: ${sku.skuCode})`);

  console.log('\n✨ DATABASE RESET COMPLETE ✨');
  console.log('--------------------------------------------------');
  console.log('Super Admin: super@platform.com / 123456');
  console.log('Tenant Admin: admin@localhost.com / 123456');
  console.log(`Test Product: ${product.name} (SKU: ${sku.skuCode})`);
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
